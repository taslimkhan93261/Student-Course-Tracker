import React, { useState } from "react";
import Login from "../Login/Login";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Lib/firebase"; // ✅ Updated import
import { useRouter } from "next/router";
import ForgotPassword from "../ForgotPassword"; // ✅ New import

function RagisterForm({ onSuccess }) {
  const [isLogin, setIsLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // ✅ New state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const router = useRouter();

  const HandleLogin = () => {
    setIsLogin(true);
  };

  const handleShowForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const singupUser = (e) => {
    e.preventDefault();

    const { email, password } = formData;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("✅ Registered:", userCredential.user);
        alert("🎉 Registered successfully!");
        if (onSuccess) onSuccess();
      })
      .catch((error) => {
        console.error("❌ Error:", error.message);
        alert("❌ Registration failed: " + error.message);
      });
  };

  if (isLogin) {
    return <Login onForgotPassword={handleShowForgotPassword} />;
  }

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[25px] 2xl:text-[33px] text-[#FFF5D9] my-[1.5rem] 2xl:my-[2.2rem]">
        Register as Course Journey
      </p>

      <form className="flex flex-col gap-[0.7rem]" onSubmit={singupUser}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
          placeholder="Enter Your Full Name"
          required
        />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
          placeholder="Enter Your Email"
          required
        />
        <div className="relative">
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
            required
          />
        </div>
        <button
          className="bg-[#262626] mt-[2rem] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[19px] text-[#FCFCD8] rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem] cursor-pointer"
          type="submit"
        >
          Create an account
        </button>
      </form>

      <p className="text-[#FCFCD8] my-[1.5rem]">
        <span className="text-[14px] 2xl:text-[18px]">Already have an account?</span>&nbsp;
        <button
          className="text-[#E1FF26] text-[14px] underline cursor-pointer 2xl:text-[18px]"
          onClick={HandleLogin}
        >
          Sign In
        </button>
      </p>

      <p className="mb-[1.2rem] sm:mb-0 text-[14px] p-[0.5rem] text-[#FFF5D9] 2xl:text-[18px]">
        <span>By creating an account you agree with our </span>
        <span className="underline cursor-pointer">Terms of Service, </span>
        <span className="underline cursor-pointer">Privacy Policy, </span>
        <span>and our default </span>
        <span className="underline cursor-pointer">
          Notification Settings.
        </span>
      </p>
    </div>
  );
}

export default RagisterForm;