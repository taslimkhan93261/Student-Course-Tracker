"use client";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../../Lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { IoPlayOutline } from "react-icons/io5";
import { AiOutlineFilePdf } from "react-icons/ai";
import { LuChevronsLeftRight } from "react-icons/lu";
import { BsBoxArrowUpRight } from "react-icons/bs";
import { FiCheckCircle } from "react-icons/fi";
import { FaGithub } from "react-icons/fa";
import Link from 'next/link';

const contentTypes = [
  {
    icon: <IoPlayOutline size={55} className="text-blue-600 mx-auto" />,
    text: "Video content for this module",
    button: "Open Video"
  },
  {
    icon: <AiOutlineFilePdf size={55} className="text-green-600 mx-auto" />,
    text: "Reading material for this module",
    button: "Open Reading"
  },
  {
    icon: <IoPlayOutline size={55} className="text-blue-600 mx-auto" />,
    text: "Video content for this module",
    button: "Open Video"
  },
  {
    icon: <AiOutlineFilePdf size={55} className="text-green-600 mx-auto" />,
    text: "Reading material for this module",
    button: "Open Reading"
  },
  {
    icon: <LuChevronsLeftRight size={55} className="text-purple-600 mx-auto" />,
    text: "Project instructions and requirements",
    button: "View Instructions"
  },
];

const ModuleDetailPage = () => {
  const router = useRouter();
  const { courseId, moduleIndex } = router.query;
  const [moduleData, setModuleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  const [githubLink, setGithubLink] = useState('');

  useEffect(() => {
    const auth = getAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(false);
      
      if (!user) {
        setError("Please sign in to access this module");
        setLoading(false);
        return;
      }

      if (!router.isReady || !courseId || !moduleIndex) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course document
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
          throw new Error("Course not found");
        }

        const courseData = courseSnap.data();
        const moduleIdx = parseInt(moduleIndex, 10);

        if (!courseData.Module || !courseData.Module[moduleIdx]) {
          throw new Error("Module not found");
        }

        // Fetch user progress
        const progressQuery = query(
          collection(db, "userProgress"),
          where("userId", "==", user.uid),
          where("courseId", "==", courseId)
        );
        const progressSnap = await getDocs(progressQuery);

        let modulesProgress = [];
        let userProgressId = null;

        if (!progressSnap.empty) {
          const progressDoc = progressSnap.docs[0];
          userProgressId = progressDoc.id;
          modulesProgress = progressDoc.data().modules || [];
        } else {
          modulesProgress = courseData.Module.map(() => ({
            status: "Not Started"
          }));
          
          const newDocRef = doc(collection(db, "userProgress"));
          await setDoc(newDocRef, {
            userId: user.uid,
            courseId: courseId,
            modules: modulesProgress
          });
          userProgressId = newDocRef.id;
        }

        // Update enrolled course with last activity
        const enrolledCourseRef = doc(db, 'users', user.uid, 'enrolledCourses', courseId);
        await updateDoc(enrolledCourseRef, {
          lastActivity: new Date()
        });

        const selectedModule = courseData.Module[moduleIdx];
        setModuleData({
          ...selectedModule,
          courseTitle: courseData.title,
          courseId: courseId,
          status: modulesProgress[moduleIdx]?.status || "Not Started",
          userProgressId: userProgressId,
          githubLink: selectedModule.githubLink || ''
        });
        setGithubLink(selectedModule.githubLink || '');

      } catch (err) {
        console.error("Error loading module:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router.isReady, courseId, moduleIndex]);

  const toggleStatus = async () => {
    if (!moduleData?.userProgressId || !moduleIndex) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const moduleIdx = parseInt(moduleIndex, 10);
      const userProgressRef = doc(db, "userProgress", moduleData.userProgressId);
      const progressSnap = await getDoc(userProgressRef);

      if (progressSnap.exists()) {
        const currentData = progressSnap.data();
        const updatedModules = [...currentData.modules];
        
        const newStatus = updatedModules[moduleIdx].status === "Complete" 
          ? "In Progress" 
          : "Complete";

        updatedModules[moduleIdx] = {
          ...updatedModules[moduleIdx],
          status: newStatus
        };

        await updateDoc(userProgressRef, {
          modules: updatedModules
        });

        // Update enrolled course with last activity and total hours
        const enrolledCourseRef = doc(db, 'users', user.uid, 'enrolledCourses', moduleData.courseId);
        await updateDoc(enrolledCourseRef, {
          lastActivity: new Date(),
          totalHours: newStatus === "Complete" ? 
            (currentData.totalHours || 0) + 1 : // Increment hours when marked complete
            Math.max(0, (currentData.totalHours || 0) - 1) // Decrement when marked incomplete
        });

        setModuleData(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update module status");
    }
  };

  const saveGithubLink = async () => {
    if (!githubLink.startsWith('https://github.com/')) {
      alert("Please enter a valid GitHub repository link.");
      return;
    }

    try {
      const courseRef = doc(db, "courses", courseId);
      const courseSnap = await getDoc(courseRef);
      const courseData = courseSnap.data();
      
      const updatedModules = [...courseData.Module];
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        githubLink: githubLink.trim()
      };

      await updateDoc(courseRef, {
        Module: updatedModules
      });

      setModuleData(prev => ({
        ...prev,
        githubLink: githubLink.trim()
      }));
      alert("GitHub link saved successfully.");
    } catch (error) {
      console.error("Failed to save GitHub link:", error);
      setError("Failed to save GitHub link");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-[#FFFCEE] min-h-screen flex items-center justify-center">
        <div className="text-center">Loading module details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFFCEE] min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Link href="/dashboard">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="bg-[#FFFCEE] min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Module Not Found</h1>
          <p className="mb-6">The requested module could not be loaded.</p>
          <Link href="/dashboard">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const contentIndex = parseInt(moduleIndex) % contentTypes.length;
  const currentContent = contentTypes[contentIndex];

  return (
    <div className="bg-[#FFFCEE] min-h-screen p-5">
      <div className="bg-white p-6 rounded-lg shadow max-w-[850px] mx-auto">
        <div>
          <div className="flex items-start justify-between">
            <h1 className="text-[28px] mb-1 f-HelveticaNeueRoman">
              {moduleData.head || 'Untitled Module'}
            </h1>
            <button
              className={`f-HelveticaNeueRoman rounded-full px-4 py-1 text-center text-[13px] ${
                moduleData.status === "Complete"
                  ? "bg-green-100 text-green-600"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {moduleData.status || ''}
            </button>
          </div>
          <p className="text-[17px] text-gray-500 f-HelveticaNeueRoman">
            Part of: {moduleData.courseTitle || 'Unknown Course'}
          </p>
        </div>

        <div className='my-6'>
          <h3 className='text-[20px] mb-1 f-HelveticaNeueRoman'>Description</h3>
          <p className="text-[17px] text-gray-500 f-HelveticaNeueRoman">
            {moduleData.desc || moduleData.description || 'No description available'}
          </p>
        </div>

        <div>
          <h3 className='text-[20px] mb-1 f-HelveticaNeueRoman'>
            {moduleData?.contentTitle ||
              (moduleIndex === '0' ? 'Video Content' :
                moduleIndex === '1' ? 'Reading Material' :
                  moduleIndex === '2' ? 'Video Content' :
                    moduleIndex === '3' ? 'Reading Material' :
                      'Project Assignment')}
          </h3>

          <div className='bg-gray-100 rounded-lg p-10 text-center mt-3'>
            {currentContent.icon}
            <p className='f-HelveticaNeueRoman text-[18px] text-gray-500 my-5'>{currentContent.text}</p>
            <button
              onClick={() => {
                if (moduleData.contentUrl) {
                  window.open(moduleData.contentUrl, '_blank');
                } else {
                  alert("Content link not available.");
                }
              }}
              className='f-PowerGrotesk text-[16px] bg-white text-black px-4 py-2 rounded-[7px] border-[1px] border-gray-300 cursor-pointer flex items-center justify-center mx-auto'
            >
              <BsBoxArrowUpRight className='mr-[10px]' />
              {currentContent.button}
            </button>
          </div>
        </div>

        {moduleIndex === '4' && (
          <div className='mt-4'>
            <label className='f-HelveticaNeueRoman'>GitHub Repository (Optional)</label>
            <div className='flex items-center w-full space-x-3 mt-3'>
              <input
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className='px-4 py-2 border-[1px] border-gray-400 rounded-[7px] w-full'
                placeholder='https://github.com/username/repository'
                type="text"
              />
              <button onClick={saveGithubLink} className='cursor-pointer px-4 py-2 border-[1px] border-gray-400 rounded-[7px]'>
                <FaGithub className='text-[23px]' />
              </button>
            </div>
          </div>
        )}

        <div className="border-b-[1px] border-gray-300 mt-6"></div>

        <div className='flex justify-between items-center mt-7'>
          <p className='f-HelveticaNeueRoman text-[15px] text-gray-400'>
            {moduleData.status === "Complete"
              ? "You've completed this module"
              : "Mark as complete when finished"}
          </p>
          <button
            onClick={toggleStatus}
            className={`f-HelveticaNeueLightItalic flex justify-center items-center cursor-pointer px-4 py-2 text-[16px] rounded-[7px] transition-all duration-300 ${
              moduleData.status === "Complete"
                ? "bg-white text-black border-[1px] border-gray-400 rounded-[7px]"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {moduleData.status !== "Complete" && (
              <FiCheckCircle className='text-white mr-3' />
            )}
            {moduleData.status === "Complete" ? "Mark as Incomplete" : "Mark as Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetailPage;