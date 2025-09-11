import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../Lib/firebase";
import Link from "next/link";

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link has been sent to your email!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[25px] 2xl:text-[33px] text-[#FFF5D9] my-[1.5rem] 2xl:my-[2.2rem]">
        Reset Your Password
      </p>

      <form className="flex flex-col gap-[0.7rem]" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#000000D4] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[18px] placeholder-gray-400 text-gray-400 border-[1px] border-gray-700 rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem]"
          placeholder="Enter Your Email"
          required
        />

        <button
          className="bg-[#262626] mt-[2rem] w-[300px] 2xl:w-[400px] text-[14px] 2xl:text-[19px] text-[#FCFCD8] rounded-full py-[0.8rem] 2xl:py-[1.2rem] px-[2rem] 2xl:px-[2.7rem] cursor-pointer"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {message && (
        <div className="mt-4 text-green-400 text-sm">{message}</div>
      )}

      {error && (
        <div className="mt-4 text-red-400 text-sm">{error}</div>
      )}

      <p className="text-[#FCFCD8] my-[1.5rem]">
        <button
          className="text-[#E1FF26] text-[14px] underline cursor-pointer 2xl:text-[18px]"
          onClick={onBackToLogin}
        >
          Back to Login
        </button>
      </p>
    </div>
  );
}