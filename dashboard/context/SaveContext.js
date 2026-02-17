"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const SaveContext = createContext();

export const SaveProvider = ({ children }) => {
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onSaveHandler, setOnSaveHandler] = useState(null);
  const [onResetHandler, setOnResetHandler] = useState(null);
  const pathname = usePathname();

  // Reset dirty state when changing pages
  useEffect(() => {
    setIsDirty(false);
    setOnSaveHandler(null);
    setOnResetHandler(null);
  }, [pathname]);

  // Handle browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const resetDirty = useCallback(() => setIsDirty(false), []);

  const handleSave = async () => {
    if (!onSaveHandler) return;
    setSaving(true);
    try {
      await onSaveHandler();
      setIsDirty(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = useCallback(() => {
    if (onResetHandler) {
      onResetHandler();
    }
    setIsDirty(false);
  }, [onResetHandler]);

  // App Level navigation protection
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest("a");
      if (target && isDirty) {
        const href = target.getAttribute("href");
        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("javascript:") &&
          href !== pathname
        ) {
          if (
            !window.confirm(
              "Careful — you have unsaved changes! Do you want to discard them?",
            )
          ) {
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("click", handleAnchorClick, true);
    return () => window.removeEventListener("click", handleAnchorClick, true);
  }, [isDirty, pathname]);

  return (
    <SaveContext.Provider
      value={{
        isDirty,
        saving,
        markDirty,
        resetDirty,
        setSaveAction: setOnSaveHandler,
        setResetAction: setOnResetHandler,
        handleSave,
        handleReset,
      }}
    >
      {children}
      {/* Global Save Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${
          isDirty
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0 pointer-events-none"
        } pb-safe`}
      >
        <div className="w-full md:pl-72 p-4 md:p-6 lg:p-8 flex justify-center">
          <div className="w-full max-w-3xl bg-[#111214] backdrop-blur-2xl border border-white/10 p-3 md:p-4 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Left Section - Warning & Pulse */}
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-150"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm md:text-base font-bold tracking-tight">
                  Careful — you have unsaved changes!
                </span>
                <span className="text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-widest hidden sm:block">
                  Save your progress to apply updates
                </span>
              </div>
            </div>

            {/* Right Section - Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold transition-all rounded-2xl px-6 py-2.5 disabled:opacity-50 flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-bold text-sm transition-all shadow-[0_8px_25px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group border border-emerald-400/20"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">Saving changes...</span>
                  </>
                ) : (
                  <>
                    <span>Save Changes</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 group-hover:bg-white transition-colors"></div>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SaveContext.Provider>
  );
};

export const useSave = () => {
  const context = useContext(SaveContext);
  if (!context) {
    throw new Error("useSave must be used within a SaveProvider");
  }
  return context;
};
