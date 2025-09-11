"use client";
import { GoPlus } from "react-icons/go";
import { FaPlay } from "react-icons/fa";
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, increment } from "firebase/firestore";
import { db } from "../Lib/firebase";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/router";
import ProgressBar from "@ramonak/react-progress-bar";
import { useEffect, useState } from "react";

const formatTimeSpent = (hours) => {
  const totalMinutes = Math.round(hours * 60); // ✅ Multiply to get actual minutes

  if (totalMinutes === 0) {
    return "Just started";
  } else if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
  } else {
    const roundedHours = (totalMinutes / 60).toFixed(1);
    return `${roundedHours} hour${roundedHours !== "1.0" ? 's' : ''}`;
  }
};

const CourseCard = ({
  id,
  title,
  category,
  description,
  isEnrolled,
  slug,
  onEnrollSuccess,
  progress: progressProp,
  showActionButton = true,
  showProgressDetails = false,
  lastActivity,
  totalHours = 0,
  onMouseEnter,
  onMouseLeave
}) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const router = useRouter();
  const [modules, setModules] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [currentTimeSpent, setCurrentTimeSpent] = useState(totalHours);

  useEffect(() => {
    console.log("Received totalHours in CourseCard:", totalHours);
    setCurrentTimeSpent(totalHours);
  }, [totalHours]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isEnrolled || !user || !id) {
        setLoadingModules(false);
        return;
      }

      try {
        // Fetch course modules
        const courseRef = doc(db, "courses", id);
        const courseSnap = await getDoc(courseRef);

        if (courseSnap.exists()) {
          const courseData = courseSnap.data();
          if (Array.isArray(courseData.Module)) {
            setModules(courseData.Module);
          }
        }

        // Fetch user progress
        const userProgressQuery = query(
          collection(db, "userProgress"),
          where("userId", "==", user.uid),
          where("courseId", "==", id)
        );
        const progressSnap = await getDocs(userProgressQuery);

        if (!progressSnap.empty) {
          const progressDoc = progressSnap.docs[0];
          setProgressData(progressDoc.data().modules || []);
        }
      } catch (err) {
        console.error("Error fetching course data:", err);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchData();
  }, [user, isEnrolled, id]);

  const completedModules = progressData.filter(mod => mod?.status === "Complete").length;
  const totalModules = modules.length;

  const calculatedProgress = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0;

  const progress = typeof progressProp === "number" ? progressProp : calculatedProgress;

  const handleEnroll = async () => {
    if (!user) {
      alert("Please login to enroll in the course.");
      return;
    }

    try {
      await setDoc(doc(db, "users", user.uid, "enrolledCourses", id), {
        enrolledAt: new Date(),
        totalHours: 0
      });

      onEnrollSuccess(id);
    } catch (err) {
      console.error("Enrollment failed:", err);
    }
  };

  const handleStart = () => {
    if (!slug) {
      console.error(`Slug not found for course: ${id}`);
      return;
    }
    router.push(`/courses/${slug}`);
  };

  return (
    <div
      className="p-5 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-[21px] text-black f-HelveticaNeueRoman">
          {title}
        </h2>
        <span className="text-[12px] bg-white/50 text-black px-3 py-[1px] rounded-full border-[1px] border-gray-300">
          {category}
        </span>
      </div>

      <p className="f-HelveticaNeueItalic text-[16px] text-gray-500 mb-4">
        {description}
      </p>

      {isEnrolled && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full">
            <ProgressBar
              completed={progress}
              height="13px"
              bgColor="#2563eb"
              baseBgColor="#f1f5f9"
              borderRadius="50px"
              isLabelVisible={false}
              animateOnRender
            />
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>{completedModules} of {totalModules} modules</span>
          </div>
        </div>
      )}

      {showActionButton && (
        <button
          className={`f-PowerGrotesk mt-4 border-[1px] border-gray-300 cursor-pointer w-full py-2 rounded-lg flex items-center justify-center ${isEnrolled ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white text-black hover:bg-gray-50"
            } transition-colors duration-300`}
          onClick={isEnrolled ? handleStart : handleEnroll}
        >
          {isEnrolled ? (
            <>
              <FaPlay className="mr-2 text-sm" />
              {progress > 0 ? "Continue" : "Start Course"}
            </>
          ) : (
            <>
              <GoPlus className="mr-2" />
              Enroll Now
            </>
          )}
        </button>
      )}
      {showProgressDetails && (
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex justify-between mb-1">
            <span>Last activity:</span>
            <span>
              {lastActivity
                ? new Date(lastActivity.seconds * 1000).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Time spent:</span>
            <span title={`${currentTimeSpent?.toFixed(2)} hrs`}>
              {typeof currentTimeSpent === 'number' && currentTimeSpent > 0
                ? formatTimeSpent(currentTimeSpent)
                : "Not started"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;