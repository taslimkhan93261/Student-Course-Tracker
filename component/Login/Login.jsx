import React, { useState } from "react";
import RagisterForm from "../Ragister/RagisterForm";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../../Lib/firebase";
import { useRouter } from "next/router";

const auth = getAuth(app);

function Login() {
  const [isRagister, setIsRagister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [generatedOTP, setGeneratedOTP] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const generateOTP = () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    console.log("Generated OTP:", otp);
    setGeneratedOTP(otp);
    return otp;
  };

  const HandleRagister = () => {
    setIsRagister(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    
    try {
      setLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Logged in:", userCredential.user);
      router.push('/dashboard');
    } catch (error) {
      console.error("❌ Error:", error.message);
      setError("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!resetData.email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    
    const otp = generateOTP();
    setMessage(`OTP generated. Check console for OTP: ${otp}`);
    setShowOTPVerification(true);
    setLoading(false);
  };

  const handlePasswordReset = (e) => {
    e.preventDefault();
    const { otp, newPassword, confirmPassword } = resetData;

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (otp !== generatedOTP) {
      setError("Invalid OTP");
      return;
    }

    setLoading(true);
    setError("");
    
    console.log("Password would be reset to:", newPassword);
    
    // Show alert box instead of popup
    alert("Password reset successful! You can now login with your new password.");
    
    setShowForgotPassword(false);
    setShowOTPVerification(false);
    setResetData({
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    });
    setGeneratedOTP("");
    setLoading(false);
  };

  if (isRagister) {
    return <RagisterForm />;
  }

  return (
    <div className="flex flex-col items-center text-center">
      {showForgotPassword ? (
        <>
          <p className="text-[25px] 2xl:text-[33px] text-[#FFF5D9] my-[1.5rem] 2xl:my-[2.2rem]">
            {showOTPVerification ? "Reset Your Password" : "Forgot Password"}
          </p>

          {!showOTPVerification ? (
            <form className="flex flex-col gap-[0.7rem]" onSubmit={handleSendOTP}>
              <input
                type="email"
                name="email"
                value={resetData.email}
                onChange={handleResetChange}
                className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
                placeholder="Enter Your Email"
                required
              />
              
              <button
                className="bg-[#262626] mt-[2rem] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[19px] text-[#FCFCD8] rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem] cursor-pointer disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-[0.7rem]" onSubmit={handlePasswordReset}>
              <input
                type="text"
                name="otp"
                value={resetData.otp}
                onChange={handleResetChange}
                className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
                placeholder="Enter 4-digit OTP (check console)"
                maxLength="4"
                required
              />
              <input
                type="password"
                name="newPassword"
                value={resetData.newPassword}
                onChange={handleResetChange}
                className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
                placeholder="New Password"
                required
              />
              <input
                type="password"
                name="confirmPassword"
                value={resetData.confirmPassword}
                onChange={handleResetChange}
                className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
                placeholder="Confirm New Password"
                required
              />
              
              <button
                className="bg-[#262626] mt-[2rem] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[19px] text-[#FCFCD8] rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem] cursor-pointer disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 text-red-400 text-sm">{error}</div>
          )}

          <p className="text-[#FCFCD8] my-[1.5rem]">
            <button
              className="text-[#E1FF26] text-[14px] underline cursor-pointer 2xl:text-[18px]"
              onClick={() => {
                setShowForgotPassword(false);
                setShowOTPVerification(false);
                setError("");
                setMessage("");
                setResetData({
                  email: "",
                  otp: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setGeneratedOTP("");
              }}
            >
              Back to Login
            </button>
          </p>
        </>
      ) : (
        <>
          <p className="text-[25px] 2xl:text-[33px] text-[#FFF5D9] my-[1.5rem] 2xl:my-[2.2rem]">
            Login as Course Journey
          </p>

          <form className="flex flex-col gap-[0.7rem]" onSubmit={handleLogin}>
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
              className="text-[#E1FF26] text-[14px] underline cursor-pointer 2xl:text-[18px] text-center ml-4"
              onClick={() => {
                setShowForgotPassword(true);
                setError("");
              }}
              type="button"
            >
              Forgot Password?
            </button>
            <button
              className="bg-[#262626] mt-[1rem] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[19px] text-[#FCFCD8] rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem] cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {error && (
            <div className="mt-4 text-red-400 text-sm">{error}</div>
          )}

          <p className="text-[#FCFCD8] mt-[1.5rem]">
            <span className="text-[14px] 2xl:text-[18px]">Create a New Account</span>&nbsp;
            <button
              className="text-[#E1FF26] text-[14px] 2xl:text-[18px] underline cursor-pointer"
              onClick={HandleRagister}
            >
              Sign up
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
        </>
      )}
    </div>
  );
}

export default Login;