"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-32 pb-20 container mx-auto px-4 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto animate-fade-in-up">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-3xl bg-blue-500/10 flex items-center justify-center text-primary shadow-glow animate-float">
              <Search size={48} />
            </div>
          </div>

          <h1 className="text-8xl md:text-9xl font-black mb-4 text-gradient">
            404
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            Lost in the abyss?
          </h2>

          <p className="text-gray-400 text-xl mb-12 leading-relaxed">
            The page you are looking for has vanished into thin air. It might
            have been moved or deleted.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="group px-8 py-4 bg-gradient-blue-glow text-white rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <Home size={20} />
              Back Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="px-8 py-4 glass-strong text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Go Back
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
