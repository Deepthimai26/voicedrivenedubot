"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "../../lib/firebaseConfig";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-end bg-cover bg-center"
      style={{
        backgroundImage:
          "url('/login.webp')",
      }}
    >
      {/* Glassmorphism Card on Right Side */}
      <div className="w-full max-w-md mr-16 p-8 rounded-2xl shadow-lg bg-white/30 backdrop-blur-lg border border-white/20">
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/60 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-800 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white/60 text-gray-800 placeholder-gray-500 focus:outline-none focus:border-indigo-400"
            />
            <div className="flex justify-end mt-2">
              <a href="/forgot-password" className="text-sm text-gray-700 hover:text-indigo-600">
                Forgot password?
              </a>
            </div>
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            className="w-full bg-cyan-600 text-white py-3 rounded-lg hover:bg-indigo-600 transition duration-300"
          >
            Sign In
          </button>
        </form>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 flex items-center justify-center gap-3 bg-amber-500 text-white py-3 rounded-lg hover:bg-red-600 transition duration-300"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          Sign in with Google
        </button>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-700 text-center">
          Don’t have an account?{" "}
          <a href="/signup" className="text-indigo-600 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
