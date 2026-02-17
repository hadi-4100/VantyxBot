"use client";
import React from "react";
import { WifiOff, RefreshCcw, Home, AlertOctagon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Error({ error, reset }) {
  const isConnectionError =
    error.isConnectionError ||
    error.message?.toLowerCase().includes("failed to fetch") ||
    error.message?.toLowerCase().includes("networkerror") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("api") ||
    error.message?.toLowerCase().includes("connect") ||
    !error.message; // Fallback for empty errors often being connection issues

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-outfit relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${
            isConnectionError ? "bg-amber-500/5" : "bg-red-500/5"
          } rounded-full blur-[120px] opacity-50`}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass-strong border border-white/5 rounded-[2.5rem] p-10 md:p-12 text-center shadow-2xl backdrop-blur-xl">
          {/* Animated Icon */}
          <div className="flex justify-center mb-8">
            <div
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-glow-lg transition-all duration-500 ${
                isConnectionError
                  ? "bg-amber-500/10 text-amber-500 shadow-amber-500/20"
                  : "bg-red-500/10 text-red-500 shadow-red-500/20"
              }`}
            >
              {isConnectionError ? (
                <WifiOff size={48} strokeWidth={1.5} />
              ) : (
                <AlertOctagon size={48} strokeWidth={1.5} />
              )}
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
            {isConnectionError ? "Connection Lost" : "Something Went Wrong"}
          </h1>

          <p className="text-gray-400 text-lg mb-10 leading-relaxed font-light">
            {isConnectionError
              ? "We couldn't reach the server. Please check your internet connection or try again in a few moments."
              : "We encountered an unexpected issue while processing your request. Our team has been notified."}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => reset()}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
                isConnectionError
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20"
                  : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20"
              }`}
            >
              <RefreshCcw size={20} strokeWidth={2.5} />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 border border-white/5"
            >
              <Home size={20} strokeWidth={2.5} />
              Return Home
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs font-mono uppercase tracking-widest opacity-50">
            Error Code:{" "}
            {isConnectionError
              ? "NET_ERR_CONNECTION_REFUSED"
              : "SYS_ERR_INTERNAL_FAULT"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
