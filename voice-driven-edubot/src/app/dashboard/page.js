"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";

export default function DashboardPage() {
  const [showMenu, setShowMenu] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      if (!currUser) router.push("/login");
      else setUser(currUser);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Navbar */}
      <header className="absolute top-0 left-0 w-full flex items-center justify-between px-8 py-4 z-40 bg-transparent">
        <div className="flex items-center space-x-3">
          <img src="/icon.png" alt="Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-yellow-400">EduBot</h1>
        </div>

        {/* Profile */}
        <div
          className="relative"
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          <div className="w-10 h-10 rounded-full text-yellow-400 flex items-center bg-black justify-center text-black font-bold cursor-pointer">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg p-4 w-48">
              <p className="text-sm text-gray-700 mb-2">{user?.email}</p>
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Left Section: Normal Mode */}
      <div className="absolute inset-0 clip-left z-20 flex flex-col justify-center items-start px-16">
        {/* Blurred Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "black url('/YOUR_BLACK_IMAGE_HERE.jpg') center/cover no-repeat",
            filter: "blur(4px)",
          }}
        />
        {/* Content */}
        <div className="relative z-30 text-left">
          <h1
            className="text-[4vw] font-extrabold uppercase mb-4"
            style={{
              WebkitTextStroke: "3px #fff",
              color: "transparent",
              fontFamily: "sans-serif",
            }}
          >
            NORMAL MODE
          </h1>
          <p className="text-white font-semibold text-lg max-w-md mb-8">
            Interact with EduBot in a simple, conversational way. Perfect for
            quick answers and learning support.
          </p>
          <button
            onClick={() => router.push("/dashboard/normal")}
            className="px-10 py-3 text-xl font-bold border-2 border-yellow-400 rounded-full bg-transparent text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
          >
            Enter Normal Mode
          </button>
        </div>
      </div>

      {/* Right Section: Doc Mode */}
      <div className="absolute inset-0 clip-right z-20 flex flex-col justify-center items-end px-16">
        {/* Blurred Background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "white url('/YOUR_WHITE_IMAGE_HERE.jpg') center/cover no-repeat",
            filter: "blur(4px)",
          }}
        />
        {/* Content */}
        <div className="relative z-30 text-right">
          <h1
            className="text-[4vw] font-extrabold uppercase mb-4"
            style={{
              WebkitTextStroke: "3px #222",
              color: "transparent",
              fontFamily: "sans-serif",
            }}
          >
            DOC MODE
          </h1>
          <p className="text-black font-semibold text-lg max-w-md mb-8">
            Upload and analyze your documents with EduBot. Get summaries,
            insights, and answers directly from your files.
          </p>
          <button
            onClick={() => router.push("/dashboard/doc")}
            className="px-10 py-3 text-xl font-bold border-2 border-yellow-400 rounded-full bg-transparent text-yellow-400 hover:bg-yellow-400 hover:text-black transition"
          >
            Enter Doc Mode
          </button>
        </div>
      </div>

      {/* Center SVG Rings */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <svg width="220" height="220">
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx="110"
              cy="110"
              r={100 - 12 * i}
              stroke="#ffbd39" // purple-500
              strokeWidth="4"
              fill="none"
              style={{ opacity: 1 - i * 0.16 }}
            />
          ))}
        </svg>
      </div>

      <style jsx>{`
        .clip-left {
          clip-path: polygon(0 0, 62% 0, 38% 100%, 0% 100%);
        }
        .clip-right {
          clip-path: polygon(62% 0, 100% 0, 100% 100%, 38% 100%);
        }
        @media (max-width: 900px) {
          .clip-left,
          .clip-right {
            clip-path: none;
          }
        }
      `}</style>
    </div>
  );
}
