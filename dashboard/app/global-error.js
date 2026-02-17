"use client";
import React from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white min-h-screen flex items-center justify-center p-6 font-outfit overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[120px] opacity-60" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="glass-strong border border-white/5 rounded-[2.5rem] p-10 md:p-12 text-center shadow-2xl backdrop-blur-xl">
            {/* Animated Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 text-red-500 flex items-center justify-center shadow-glow-lg transition-all shadow-red-500/20">
                <AlertTriangle size={48} strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
              System Failure
            </h1>

            <p className="text-gray-400 text-lg mb-10 leading-relaxed font-light">
              A critical system error has occurred. For security and stability
              reasons, the application has been halted.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => reset()}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                <RefreshCcw size={20} strokeWidth={2.5} />
                Reset System
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 border border-white/5"
              >
                <Home size={20} strokeWidth={2.5} />
                Return Home
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-xs font-mono uppercase tracking-widest opacity-50">
              Error Code: CRITICAL_SYS_FAILURE
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
