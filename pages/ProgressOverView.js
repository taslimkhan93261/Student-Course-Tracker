"use client";
import React, { useState, useEffect } from 'react';
import { getDocs, collection, query, where, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../Lib/firebase';
import CourseCard from '@/component/card';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaBook } from "react-icons/fa";
import { CiStopwatch } from "react-icons/ci";
import { GrCompliance } from "react-icons/gr";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js/auto';
import { Pie, Line } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

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

const ProgressOverView = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [categoryData, setCategoryData] = useState({
    'Backend': 0,
    'DevOps': 0,
    'Frontend': 0,
    'Design': 0,
    'Other': 0
  });
  const [dailyProgressData, setDailyProgressData] = useState([]);
  const [dailyProgressLabels, setDailyProgressLabels] = useState([]);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Real-time tracking effect
  useEffect(() => {
    let interval;
    const auth = getAuth();
    const user = auth.currentUser;

    if (activeCourseId && user) {
      interval = setInterval(async () => {
        try {
          // Add 1 minute of time (0.0167 hours)
          const hoursToAdd = 1 / 60;

          // Update in Firebase
          const courseRef = doc(db, 'users', user.uid, 'enrolledCourses', activeCourseId);
          await updateDoc(courseRef, {
            totalHours: increment(hoursToAdd),
            lastActivity: new Date()
          });

          // Update local state
          setCourses(prev => prev.map(c =>
            c.id === activeCourseId
              ? {
                ...c,
                totalHours: c.totalHours + hoursToAdd,
                lastActivity: { seconds: Math.floor(Date.now() / 1000) }
              }
              : c
          ));

          setTotalHours(prev => prev + hoursToAdd);

        } catch (error) {
          console.error("Error updating time:", error);
        }
      }, 60000); // Update every minute
    }

    return () => clearInterval(interval);
  }, [activeCourseId]);

  // Start/stop tracking
  const startTrackingTime = (courseId) => {
    setActiveCourseId(courseId);
    setStartTime(new Date());
  };

  const stopTrackingTime = async () => {
    if (activeCourseId && startTime) {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const minutesSpent = Math.floor((new Date() - startTime) / 60000);
        const hoursToAdd = minutesSpent / 60;

        // Update in Firebase
        const courseRef = doc(db, 'users', user.uid, 'enrolledCourses', activeCourseId);
        await updateDoc(courseRef, {
          totalHours: increment(hoursToAdd),
          lastActivity: new Date()
        });

        // Update local state
        setCourses(prev => prev.map(c =>
          c.id === activeCourseId
            ? {
              ...c,
              totalHours: c.totalHours + hoursToAdd,
              lastActivity: { seconds: Math.floor(Date.now() / 1000) }
            }
            : c
        ));
        setTotalHours(prev => prev + hoursToAdd);

      } catch (error) {
        console.error("Error updating time:", error);
      }
    }
    setActiveCourseId(null);
    setStartTime(null);
  };

  // Fetch initial data
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [enrolledSnap, courseSnap, progressSnap] = await Promise.all([
          getDocs(collection(db, 'users', user.uid, 'enrolledCourses')),
          getDocs(collection(db, 'courses')),
          getDocs(query(collection(db, 'userProgress'), where('userId', '==', user.uid)))
        ]);

        const enrolledCourses = enrolledSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastActivity: doc.data().lastActivity || null,
          totalHours: doc.data().totalHours || 0
        }));

        const allCourses = courseSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          Module: doc.data().Module || []
        }));

        const userProgress = progressSnap.docs.map(doc => doc.data());

        // Process data
        const updatedCategoryData = {
          'Backend': 0,
          'DevOps': 0,
          'Frontend': 0,
          'Design': 0,
          'Other': 0
        };

        let completedCount = 0;
        let totalHrs = 0;

        const enrichedCourses = allCourses
          .filter(course => enrolledCourses.some(c => c.id === course.id))
          .map(course => {
            const userCourse = enrolledCourses.find(c => c.id === course.id);
            const progressData = userProgress.find(p => p.courseId === course.id);

            const category = course.category || 'Other';
            const hours = userCourse?.totalHours || 0;

            updatedCategoryData[category] = (updatedCategoryData[category] || 0) + hours;
            totalHrs += hours;

            const modules = course.Module || [];
            const completedModules = progressData?.modules?.filter(m => m?.status === "Complete").length || 0;
            const progressPercentage = modules.length > 0
              ? Math.round((completedModules / modules.length) * 100)
              : 0;

            if (modules.length > 0 && completedModules === modules.length) {
              completedCount++;
            }

            return {
              ...course,
              lastActivity: userCourse?.lastActivity,
              totalHours: hours,
              progress: {
                percentage: progressPercentage,
                completed: completedModules,
                total: modules.length
              },
            };
          });

        setCategoryData(updatedCategoryData);
        setDailyProgressData(getLastSevenDaysProgress(enrichedCourses));
        setDailyProgressLabels(getLastSevenDaysLabels());

        setCourses(enrichedCourses);
        setTotalHours(totalHrs);
        setTotalCompleted(completedCount);

      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getLastSevenDaysProgress = (courses) => {
    const result = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    courses.forEach(course => {
      if (course.lastActivity) {
        const activityDate = new Date(course.lastActivity.seconds * 1000);
        activityDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((today - activityDate) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays < 7) {
          result[6 - diffDays] += course.progress?.percentage || 0;
          dayCounts[6 - diffDays]++;
        }
      }
    });

    return result.map((total, index) =>
      dayCounts[index] > 0 ? Math.round(total / dayCounts[index]) : 0
    );
  };

  const getLastSevenDaysLabels = () => {
    const labels = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    }

    return labels;
  };

  if (loading) {
    return (
      <div className='bg-[#FFFCEE] w-full min-h-screen px-9 pt-28 flex justify-center items-center'>
        <div className='text-center'>Loading your courses...</div>
      </div>
    );
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 border-gray-300 shadow-md border-b px-9 py-4 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#FFFCEE]/10 backdrop-blur-md' : 'bg-[#FFFCEE]'}`}>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className="f-PowerGrotesk text-black text-[25px] leading-[25px]">Course <br /> Tracking</h1>
            <img className="absolute left-[8.4rem] top-[3.1rem]" src="images/business.svg" alt="" />
            <p className="f-PowerGrotesk absolute left-[9.2rem] top-[3.1rem] text-[12px] text-purple-700">Journey</p>
          </div>
        </div>
      </nav>
      <div className='bg-[#FFFCEE] w-full min-h-screen px-9 pt-28 pb-12'>
        {/* Summary Cards */}
        <div className="grid grid-cols-12 gap-5 mb-6">
          <div className="col-span-4">
            <div className="bg-white border-[1px] border-gray-400 flex items-center space-x-4 rounded-[10px] p-6">
              <div>
                <FaBook className='text-blue-500 text-[35px]' />
              </div>
              <div>
                <h5 className='f-HelveticaNeueRoman text-[18px]'>Total Enrolled Courses</h5>
                <p className="f-PowerGrotesk text-[26px] text-black">{courses.length}</p>
              </div>
            </div>
          </div>
          <div className="col-span-4">
            <div className="bg-white border-[1px] border-gray-400 flex items-center rounded-[10px] p-6">
              <div>
                <CiStopwatch className='text-purple-700 text-[50px] mr-3' />
              </div>
              <div>
                <h5 className='f-HelveticaNeueRoman text-[18px]'>Total Time Spent</h5>
                <p className="f-PowerGrotesk text-[26px] text-black">
                  {formatTimeSpent(totalHours)}
                </p>
              </div>
            </div>
          </div>
          <div className="col-span-4">
            <div className="bg-white border-[1px] border-gray-400 flex items-center space-x-4 rounded-[10px] p-6">
              <div>
                <GrCompliance className='text-orange-500 text-[37px]' />
              </div>
              <div>
                <h5 className='f-HelveticaNeueRoman text-[18px]'>Courses Completed</h5>
                <p className="f-PowerGrotesk text-[26px] text-black">{totalCompleted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-12 gap-5 mb-8">
          <div className="col-span-6">
            <div className='bg-white border-[1px] border-gray-400 rounded-[10px] py-5 px-6'>
              <h1 className='f-HelveticaNeueRoman text-[24px]'>Time Spent by Category</h1>
              <p className='f-HelveticaNeueRoman text-gray-400 text-[16px] mb-4'>Distribution of learning hours</p>
              <div className="h-[230px] mb-3 mt-6 cursor-pointer">
                <Pie
                  data={{
                    labels: Object.keys(categoryData),
                    datasets: [{
                      data: Object.values(categoryData),
                      backgroundColor: [
                        '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
                        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
                      ],
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: 'circle'
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            return `${context.label}: ${formatTimeSpent(context.raw)}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className='bg-white border-[1px] border-gray-400 rounded-[10px] py-5 px-6'>
              <h1 className='f-HelveticaNeueRoman text-[24px]'>Progress Over Time</h1>
              <p className='f-HelveticaNeueRoman text-gray-400 text-[16px] mb-4'>Your learning progress in the last 7 days</p>
              <div className="h-[230px] mb-3 mt-6 cursor-pointer relative">
                {dailyProgressData.some(val => val > 0) ? (
                  <>
                    <div className="absolute left-0 top-0 text-xs text-gray-400">100%</div>
                    <div className="absolute left-0 top-[25%] text-xs text-gray-400">75%</div>
                    <div className="absolute left-0 top-[50%] text-xs text-gray-400">50%</div>
                    <div className="absolute left-0 top-[75%] text-xs text-gray-400">25%</div>
                    <div className="absolute left-0 bottom-0 text-xs text-gray-400">0%</div>

                    <Line
                      data={{
                        labels: dailyProgressLabels,
                        datasets: [{
                          label: 'Progress',
                          data: dailyProgressData,
                          borderColor: '#4F46E5',
                          backgroundColor: 'rgba(79, 70, 229, 0.1)',
                          borderWidth: 2,
                          tension: 0.1,
                          pointBackgroundColor: '#4F46E5',
                          pointBorderColor: '#fff',
                          pointRadius: 4,
                          pointHoverRadius: 6,
                          fill: true
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.parsed.y}% average progress`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            display: false,
                            ticks: { stepSize: 25 }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { color: '#6B7280', maxRotation: 0 }
                          }
                        }
                      }}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No progress data available for the last 7 days</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <h1 className='f-PowerGrotesk text-black text-[25px] leading-[25px] mb-6 mt-8'>Your Courses</h1>
        {courses.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {courses.map(course => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                category={course.category}
                description={course.description}
                slug={course.slug}
                isEnrolled={true}
                showActionButton={false}
                showProgressDetails={true}
                lastActivity={course.lastActivity}
                totalHours={course.totalHours} // ✅ Should be < 1 to show minutes
                progress={course.progress}
                onMouseEnter={() => startTrackingTime(course.id)}
                onMouseLeave={stopTrackingTime}
              />
            ))}
          </div>
        ) : (
          <div className='bg-white w-full border-[1px] border-gray-300 rounded-[5px] py-20'>
            <p className='text-center text-[18px] text-gray-600 f-HelveticaNeueRoman'>
              You have not enrolled in any courses yet.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProgressOverView;