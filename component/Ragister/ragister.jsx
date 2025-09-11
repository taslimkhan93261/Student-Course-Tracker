import React, { useState } from "react";
import RagisterForm from "./RagisterForm";
import { FaBook } from "react-icons/fa";
import { GrInProgress } from "react-icons/gr";
import { FaMedal } from "react-icons/fa6";
import { LuUsers } from "react-icons/lu";
import { useRouter } from "next/router";

function Ragister() {
   const router = useRouter();

  const handleSuccessfulRegistration = () => {
    router.push('/dashboard');
  };
  return (
    <div className="min-h-screen xl:flex">
      <div className="left max-w-[100%]">
        <div className="h-full w-full bg-black/70">
          <div className="py-[2rem] h-full px-[1rem] sm:px-[3rem] flex flex-col justify-between">
            {/* NAVBAR */}
            <nav className="relative">
              <h1 className="f-PowerGrotesk text-white text-[25px] leading-[25px]">Course <br /> Tracking</h1>
              <img
                className="absolute left-[6.4rem] top-[2.1rem]"
                src="images/business.svg"
                alt=""
              />
              <p className="f-PowerGrotesk absolute left-[7.2rem] top-[2.1rem] text-[12px] text-purple-700">Journey</p>
            </nav>

            {/* FOOTER */}
            <div className="xl:pr-[5rem]">
              <div className="xl:pr-[16rem]">
                {/* 1 */}
                <h1 className="pt-10 sm:py-6 !px-0 xl:py-0 text-center xl:!text-left  2xl:text-[60px] 2xl:leading-[4rem] f-HelveticaNeueRoman leading-[2rem] sm:leading-[2.7rem] text-[#FFF5D9] text-[28px] sm:text-[40px] mb-[1rem] xl:max-w-[600px]">
                  Track Your Learning Journey
                </h1>
                {/* 2 */}
                <div className="pb-6 lg:px-[18rem] xl:px-0 xl:pb-0 text-[#FFF5D9] flex flex-wrap justify-center xl:justify-start max-w-[100%] xl:max-w-[500px] 2xl:max-w-[700px]">
                  <p className="sm:text-[15px] xl:text-[18px] 2xl:text-[20px] f-HelveticaNeueRoman">
                    Organize courses, monitor progress, and achieve your educational goals with our comprehensive course tracker.
                  </p>
                </div>
              </div>
              {/* 3 */}
              <div className="grid grid-cols-10 gap-6 mt-12">
                <div className="col-span-4 flex items-center bg-black/20 backdrop-blur-md rounded-lg border-[1px] border-gray-900 py-4 px-5">
                  <FaBook className="text-blue-600 text-[50px] pr-4" />
                  <div>
                    <h3 className="f-PowerGrotesk text-[#E1FF26] text-[20px] leading-[26px]">Course Management</h3>
                    <p className="f-HelveticaNeueRoman text-white text-[14px]">Organize all your courses</p>
                  </div>
                </div>
                 <div className="col-span-4 flex items-center bg-black/20 backdrop-blur-md rounded-lg border-[1px] border-gray-900 py-4 px-5">
                  <GrInProgress className="text-green-600 text-[50px] pr-4" />
                  <div>
                    <h3 className="f-PowerGrotesk text-[#E1FF26] text-[20px] leading-[26px]">Progress Tracking</h3>
                    <p className="f-HelveticaNeueRoman text-white text-[14px]">Monitor your advancement</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-6 mt-6">
                <div className="col-span-4 flex items-center bg-black/20 backdrop-blur-md rounded-lg border-[1px] border-gray-900 py-4 px-5">
                  <FaMedal className="text-purple-600 text-[50px] pr-4" />
                  <div>
                    <h3 className="f-PowerGrotesk text-[#E1FF26] text-[20px] leading-[26px]">Achievement Goals</h3>
                    <p className="f-HelveticaNeueRoman text-white text-[14px]">Set and reach milestones</p>
                  </div>
                </div>
                 <div className="col-span-4 flex items-center bg-black/20 backdrop-blur-md rounded-lg border-[1px] border-gray-900 py-4 px-5">
                  <LuUsers className="text-orange-600 text-[50px] pr-4" />
                  <div>
                    <h3 className="f-PowerGrotesk text-[#E1FF26] text-[20px] leading-[26px]">Community</h3>
                    <p className="f-HelveticaNeueRoman text-white text-[14px]">Connect with learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="right !w-[100%] xl:max-w-[30%] text-center flex items-center justify-center bg-[#050505] px-[6rem]">
        <RagisterForm onSuccess={handleSuccessfulRegistration} />
      </div>
    </div>
  );
}

export default Ragister;
