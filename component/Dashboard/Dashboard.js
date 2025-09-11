import React, { useState, useEffect } from 'react';
import { CiSearch } from "react-icons/ci";
import { IoBookOutline } from "react-icons/io5";
import { getDocs, collection } from "firebase/firestore";
import { db } from '../../Lib/firebase';
import CourseCard from '../card';
import { getAuth } from "firebase/auth";
import Link from 'next/link';

const Dashboard = () => {
  const categories = ["All categories", "Frontend", "Backend", "AI", "DevOps"];
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courseSnap = await getDocs(collection(db, "courses"));
        const allCourses = courseSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const auth = getAuth();
        const user = auth.currentUser;

        const filteredCourses = allCourses.filter(course => course.slug); // ✅ Only courses with slug

        if (!user) {
          setCourses(filteredCourses); // guest user
          return;
        }

        const enrolledSnap = await getDocs(collection(db, "users", user.uid, "enrolledCourses"));
        const enrolledMap = {};
        enrolledSnap.docs.forEach(doc => {
          enrolledMap[doc.id] = doc.data().progress;
        });

        const combinedCourses = filteredCourses.map(course => ({
          ...course,
          isEnrolled: enrolledMap.hasOwnProperty(course.id),
          progress: enrolledMap[course.id] || 0
        }));

        setCourses(combinedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filterCourses = (courseList) => {
    return courseList.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All categories' ||
        course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const myCourses = courses.filter(course => course.isEnrolled);
  const availableCourses = courses.filter(course => !course.isEnrolled);

  const filteredMyCourses = filterCourses(myCourses);
  const filteredAvailableCourses = filterCourses(availableCourses);

  const handleEnrollSuccess = (courseId) => {
    setCourses(prev => prev.map(course =>
      course.id === courseId
        ? { ...course, isEnrolled: true, progress: 0 }
        : course
    ));
  };

  if (loading) {
    return (
      <div className='bg-[#FFFCEE] w-full min-h-screen px-9 pt-28 flex justify-center items-center'>
        <div className="text-center">Loading courses...</div>
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
          <div>
            <Link href="/ProgressOverView">
            <button className='f-HelveticaNeueRoman text-[16px] bg-[#EEFF00] text-purple-700 px-5 py-2 rounded-[10px] border-[1px] border-gray-300 cursor-pointer'>
              Progress OverView
            </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className='bg-[#FFFCEE] w-full min-h-screen px-9 pt-28 pb-12'>
        {/* Search and Filter */}
        <div className='grid grid-cols-12 gap-5 mb-8'>
          <div className="col-span-9">
            <div className='relative'>
              <CiSearch className='f-PowerGrotesk absolute top-[13px] left-[13px]' />
              <input
                className='f-PowerGrotesk w-full px-9 py-2 border-[1px] border-gray-300 rounded-[5px] bg-white'
                placeholder='Search Courses...'
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-span-3">
            <select
              className="f-PowerGrotesk w-full px-4 py-[10px] border-[1px] border-gray-300 rounded-[5px] bg-white text-gray-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* My Courses */}
        <section className='mb-12'>
          <h1 className="f-PowerGrotesk text-black text-[25px] leading-[25px] mb-6">My Courses</h1>
          {filteredMyCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMyCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  category={course.category}
                  description={course.description}
                  slug={course.slug}
                  modules={course.Module || []} // ✅ modules prop added safely
                  isEnrolled={course.isEnrolled}
                  onEnrollSuccess={handleEnrollSuccess}
                />
              ))}
            </div>
          ) : (
            <div className='bg-white w-full border-[1px] border-gray-300 rounded-[5px] py-20'>
              <IoBookOutline className='text-gray-400 mx-auto text-[50px]' />
              <h3 className='text-center text-[22px] text-black pt-3 pb-1 f-PowerGrotesk'>No enrolled courses</h3>
              <p className='text-center text-[18px] text-gray-600 f-HelveticaNeueRoman'>Start by enrolling in your first course below</p>
            </div>
          )}
        </section>

        {/* Available Courses */}
        <section>
          <h1 className="f-PowerGrotesk text-black text-[25px] leading-[25px] mb-6">Available Courses</h1>
          {filteredAvailableCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableCourses.map((course) => (
                course.slug && (
                  <CourseCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    category={course.category}
                    description={course.description}
                    slug={course.slug}
                    modules={course.Module || []} // ✅ modules prop added safely
                    isEnrolled={course.isEnrolled}
                    onEnrollSuccess={handleEnrollSuccess}
                  />
                )
              ))}
            </div>
          ) : (
            <div className='bg-white w-full border-[1px] border-gray-300 rounded-[5px] py-20'>
              <IoBookOutline className='text-gray-400 mx-auto text-[50px]' />
              <h3 className='text-center text-[22px] text-black pt-3 pb-1 f-PowerGrotesk'>
                {courses.length > 0 ? "No available courses" : "No courses found"}
              </h3>
              <p className='text-center text-[18px] text-gray-600 f-HelveticaNeueRoman'>
                {courses.length > 0 ? "You've enrolled in all available courses" : "Please check back later"}
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Dashboard;
