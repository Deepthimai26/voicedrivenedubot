"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, FileText, History, MessageSquare, Shield, Zap } from "lucide-react";
import Image from "next/image";

const Home = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-purple-900 via-black to-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-20 flex justify-between items-center px-8 py-4 bg-transparent">
        <div className="flex items-center gap-2">
          <img src="/icon.png" alt="Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold text-purple-400">EduBot</h1>
        </div>
        <ul className="hidden md:flex gap-8 text-lg font-semibold text-pink-500 ml-28">
          {["Home", "Features", "About", "Contact"].map((item) => (
            <li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className="relative group hover:text-purple-400 transition"
              >
                {item}
                <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-purple-400 transition-all duration-300 group-hover:w-full"></span>
              </a>
            </li>
          ))}
        </ul>
        <Link href="/signup">
        <button className="ml-6 px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-md font-semibold hover:opacity-90 transition">
          Sign Up
        </button></Link>
      </nav>

      {/* Hero */}
      <section
        id="home"
        className="relative flex flex-col md:flex-row items-center justify-between min-h-screen px-8 md:px-18 overflow-hidden bg-gradient-to-br from-purple-900 via-black to-violet-800"
      >
        <motion.div
          className="md:w-1/2 text-center md:text-left space-y-6"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl md:text-4xl font-bold leading-tight font-display">
      Welcome to <span className="text-purple-400">EduBot</span>  
    </h2>
          <p className="text-lg text-gray-300 max-w-lg">
      Your personal <span className="text-pink-400">AI-powered learning assistant</span>.  
      EduBot lets you <strong>ask questions with your voice</strong>,  
      <strong>analyze documents</strong>, and <strong>get instant answers</strong>.  
      It’s like having a <span className="text-yellow-300">24/7 study partner </span>  
      ready to help you with anything you need.
    </p>
    <p className="text-gray-400 max-w-lg">
      Whether you’re a <span className="text-purple-300">student preparing for exams</span>,  
      a <span className="text-green-300">professional analyzing reports</span>,  
      or just curious about the world — EduBot adapts to your needs.  
      Learning has never been this easy, interactive, and fun!
    </p>
    <div className="flex justify-center md:justify-start gap-4">
      <Link href="/login">
      <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-md shadow-md hover:opacity-90 transition">
        Get Started
      </button></Link>
      <Link href="/signup">
        <button className="px-6 py-3 border border-gray-500 text-white font-semibold rounded-md hover:bg-gray-800 transition">
        Explore Bot
      </button></Link>
    </div>
  </motion.div>

        {/* Hero Illustration with Oval */}
        <motion.div
          className="flex justify-center items-center min-h-screen md:ml-[-20px]"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1 }}
        >
          <div className="relative flex flex-col items-center w-[400px] h-[480px] top-[40px] left-[-40px]">
            <div className="absolute w-[380px] h-[470px] bg-violet-700 rounded-[50%] -top-[20px] left-[-20px]"></div>
            <div className="absolute w-[310px] h-[460px] border-2 border-violet-400 rounded-[50%] -rotate-12 -top-[10px] left-[-18px]"></div>
            <div className="absolute w-[320px] h-[450px] border-2 border-red-400 rounded-[50%] rotate-[15deg] left-[-15px] top-[8px]"></div>

            <div className="relative z-10 flex flex-col items-center w-full h-full bg-gradient-to-br from-pink-500/90 to-purple-800/60 rounded-[50%] shadow-2xl">
              <img
                src="/chatbot-robot.jpg"
                alt="Cinematic Virtual Reality"
                className="w-[200px] mt-8 rounded-[36px] object-cover"
              />
              <h2 className="text-white text-xl font-semibold mt-6 mb-1 font-display">
          Smarter Learning with AI
        </h2>
              <hr className="border-violet-200 w-[90%] mb-3" />
             <p className="px-6 text-violet-200 text-center text-base">
          EduBot isn’t just another chatbot — it’s an  
          <span className="text-yellow-300"> interactive companion </span>  
          designed to boost your learning, improve efficiency,  
          and make every answer feel effortless. 🚀
        </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features (half & quarter circles) */}
      <section id="features" className="relative py-20 text-white min-h-screen  bg-gradient-to-tr from-purple-900 via-black to-violet-800 overflow-hidden">

        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Mic className="w-10 h-10 text-pink-400" />, title: "Voice Querying", desc: "Ask questions and get instant answers with voice." },
              { icon: <FileText className="w-10 h-10 text-green-400" />, title: "Doc Analysis", desc: "Upload PDFs, PPTs and get insights." },
              { icon: <History className="w-10 h-10 text-purple-400" />, title: "Chat History", desc: "Maintain and revisit your past queries." },
              { icon: <MessageSquare className="w-10 h-10 text-pink-500" />, title: "Smart Replies", desc: "AI-powered contextual answers." },
              { icon: <Shield className="w-10 h-10 text-red-400" />, title: "Secure", desc: "Your data is protected with advanced security." },
              { icon: <Zap className="w-10 h-10 text-yellow-400" />, title: "Fast & Efficient", desc: "Quick responses optimized for speed." },
            ].map((f, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-xl shadow-lg bg-black/40 border border-gray-800 hover:shadow-xl transition"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-center mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About (layered squares + circles) */}
    <section
  id="about"
  className="py-20 min-h-screen flex items-center relative overflow-hidden bg-gradient-to-br from-purple-900 via-black to-violet-800"
>
  <motion.div
    className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 1 }}
    viewport={{ once: true }}
  >
    {/* Left Side: Big image with decorative shapes */}
    <div className="relative flex justify-center items-center">
      {/* Shape 1 */}
      <div className="absolute top-[-40px] left-[10px] w-[180px] h-[200px] bg-pink-500 rounded-[40%_70%_80%_70%] rotate-12 -z-10"></div>

      {/* Shape 2 */}
      <div className="absolute bottom-[-60px] right-[10px] w-[200px] h-[200px] bg-yellow-400 rounded-[50%_70%_40%_80%] rotate-6 -z-10"></div>

      {/* About image (big like Contact) */}
      <img
        src="/about.png"
        alt="About EduBot"
        className="relative w-[380px] h-[320px] object-contain rounded-4xl shadow-2xl"
      />
    </div>

    {/* Right Side: Text */}
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      viewport={{ once: true }}
      className="text-white"
    >
      <h2 className="text-3xl font-bold mb-4">About EduBot</h2>
      <p className="leading-relaxed">
        EduBot is designed to make learning smarter and more interactive.
        By combining voice-driven AI with powerful document analysis,
        EduBot helps students and professionals quickly get the insights they need.
      </p>
    </motion.div>
  </motion.div>
</section>



      {/* Contact (outlined circles + triangles) */}
    <section
      id="contact"
      className="relative py-20 min-h-screen flex items-center justify-center  bg-gradient-to-tr from-purple-900 via-black to-violet-800 text-white px-8 md:px-20"
    >
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center rounded-xl shadow-lg bg-gray-200 backdrop-blur-md">
        {/* Left: Illustration with half-oval purple shape */}
        <div className="relative flex justify-center items-center p-8">
          <div className="absolute left-[250px] top-[-30px] w-[200px] h-[200px] rounded-r-[160px] rounded-l-[160px] bg-gradient-to-br from-violet-700 to-pink-500 opacity-90 -z-10"></div>
          {/* Purple half-oval background shape */}
          <div className="absolute left-[-10px] top-28 w-[300px] h-[300px] rounded-r-[160px] rounded-l-[160px] bg-gradient-to-br from-pinkt-500 to-violet-800 opacity-90 -z-10"></div>

          {/* Illustration */}
          <img
            src="/contact.jpg" // Replace with your actual illustration
            alt="Contact Illustrative"
            className="relative rounded-2xl w-[320px] shadow-lg"
          />
        </div>

        {/* Right: Contact Form Panel */}
        <motion.div
          className="max-w-lg mx-auto rounded-2xl p-10  bg-violet-400 shadow-xl text-white"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
          <p className="mb-8">
            Have questions? Reach out to us below.
          </p>
          <form
            action="https://formspree.io/f/xdkdwbpd"
            method="POST"
            className="space-y-6"
          >
            <input
              type="text"
              name="name"
              placeholder="Name"
              className="w-full p-4 rounded bg-white text-black border border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-700"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-4 rounded bg-white text-black border border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-700"
              required
            />
            <textarea
              name="message"
              placeholder="Message"
              rows={4}
              className="w-full p-4 rounded bg-white text-black border border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-700"
              required
            ></textarea>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-700 text-white rounded-lg font-semibold shadow-lg hover:opacity-90 transition"
            >
              SUBMIT
            </button>
          </form>
        </motion.div>
      </div>
    </section>
</div>
  );
};

export default Home;
