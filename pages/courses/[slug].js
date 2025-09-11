import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../Lib/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { IoPlayOutline } from "react-icons/io5";
import { AiOutlineFilePdf } from "react-icons/ai";
import { LuChevronsLeftRight } from "react-icons/lu";
import { FaArrowLeft } from "react-icons/fa";
import Link from 'next/link';
import ProgressBar from "@ramonak/react-progress-bar";

const CourseDetail = () => {
  const router = useRouter();
  const { slug } = router.query;
  const [course, setCourse] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);

  const icons = [IoPlayOutline, AiOutlineFilePdf, IoPlayOutline, AiOutlineFilePdf, LuChevronsLeftRight];
  const ButtonLabels = ["video", "reading", "video", "reading", "project"];

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, "courses"));
      const found = snapshot.docs.find(doc => doc.data().slug === slug);

      if (!found) {
        setLoading(false);
        return;
      }

      const courseData = { id: found.id, ...found.data() };
      setCourse(courseData);

      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const userProgressQuery = query(
          collection(db, "userProgress"),
          where("userId", "==", user.uid),
          where("courseId", "==", found.id)
        );
        const progressSnap = await getDocs(userProgressQuery);
        
        if (!progressSnap.empty) {
          const progressDoc = progressSnap.docs[0];
          setProgressData(progressDoc.data().modules || []);
        } else {
          // Initialize progress if not exists
          const initialModules = courseData.Module?.map(() => ({
            status: "Not Started"
          })) || [];
          setProgressData(initialModules);
        }
      }

      setLoading(false);
    };

    if (slug) fetchData();
  }, [slug]);

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found.</div>;

  const totalModules = course.Module?.length || 0;
  const completedModules = progressData.filter(mod => mod.status === "Complete").length;
  const percentage = Math.round((completedModules / totalModules) * 100);

  return (
    <div className="bg-[#FFFCEE] w-full min-h-screen py-8 px-20 relative">
      <div className='absolute fixed bottom-[30px] left-5'>
        <Link href="/dashboard">
          <button className='p-3 rounded-full border-[1px] border-gray-300 bg-white cursor-pointer shadow-md hover:shadow-xl duration-300'>
            <FaArrowLeft className='text-red-600' />
          </button>
        </Link>
      </div>
      <div className='bg-white p-5 rounded-[5px] border-[1px] border-gray-300'>
        <div className='flex justify-between items-center mb-2'>
          <h1 className="f-HelveticaNeueRoman tracking-tight text-2xl mb-1">{course.title}</h1>
          <span className="text-[12px] bg-white/50 text-black px-3 py-[1px] rounded-full border-[1px] border-gray-300">
            {course.category}
          </span>
        </div>
        <p className="text-gray-500 text-[18px]">{course.description}</p>
        <ul className="list-disc ml-6">
          {course.modules?.map((mod, idx) => (
            <li key={idx}>{mod}</li>
          ))}
        </ul>
        <div className="w-full mt-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="f-HelveticaNeueRoman text-gray-600 text-[16px]">
                Progress
              </div>
              <div className="flex items-center">
                <div className="w-[300px] mr-3">
                  <ProgressBar
                    completed={percentage}
                    height="13px"
                    bgColor="#2563eb"
                    baseBgColor="#f1f5f9"
                    borderRadius="50px"
                    isLabelVisible={false}
                    animateOnRender
                  />
                </div>
                <div className="text-[16px] font-medium text-black">{percentage}%</div>
              </div>
            </div>
            <div>
              <h3 className='f-HelveticaNeueRoman text-gray-600 text-[16px]'>Modules Completed</h3>
              <span className="f-HelveticaNeueRoman text-2xl font-bold text-gray-900">{completedModules}&nbsp;</span>
              <span className="f-HelveticaNeueRoman text-2xl font-bold text-gray-900">/ {totalModules}</span>
            </div>
          </div>
        </div>
      </div>
      <h1 className='f-PowerGrotesk text-[26px] pt-7 pb-2'>Course Modules</h1>
      <div>
        {Array.isArray(course.Module) &&
          course.Module.map((mod, idx) => {
            const IconComponent = icons[idx];
            const userModStatus = progressData[idx]?.status || "Not Started";
            return (
              <Link key={idx} href={`/module-details/${course.id}/${idx}`}>
                <div className="bg-white border-[1px] border-gray-300 rounded-[6px] p-6 my-3 cursor-pointer hover:shadow-lg duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        {IconComponent && <IconComponent className="text-green-600 text-[27px]" />}
                        <h1 className="f-HelveticaNeueRoman text-xl font-medium text-gray-900">
                          {mod.head || mod}
                        </h1>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors text-xs bg-blue-100 text-blue-800">
                          {ButtonLabels[idx]}
                        </span>
                      </div>
                      <div>
                        {mod.desc && (
                          <p className="text-gray-600 text-[17px] mt-1 f-HelveticaNeueLight">
                            {mod.desc}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      {userModStatus === "Complete" ? (
                        <button className="bg-white text-black f-HelveticaNeueRoman border-[1px] border-gray-400 cursor-pointer max-w-[200px] px-3 py-[6px] rounded-lg flex items-center justify-center text-[14px]">
                          Review
                        </button>
                      ) : (
                        <button className="bg-blue-500 text-white f-PowerGrotesk border-[1px] border-gray-400 cursor-pointer max-w-[200px] px-3 py-[6px] rounded-lg flex items-center justify-center">
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
};

export default CourseDetail;