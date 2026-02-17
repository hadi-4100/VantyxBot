"use client";
import { useEffect, useState, useRef, use, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

import { api } from "@/utils/api";
import {
  UserPlus,
  MessageSquare,
  Image as ImageIcon,
  LogOut,
  Settings,
  Type,
  User,
  Trash2,
  X,
  Upload,
  Bold,
  Italic,
  RotateCcw,
} from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import { GenericSelector } from "@/components/Dropdowns";
import Image from "next/image";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

export default function WelcomeSettings({ params }) {
  const { id } = use(params);
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [errorVisible, setErrorVisible] = useState(null);
  const [activeSection, setActiveSection] = useState("welcome"); // 'welcome', 'image', 'goodbye'
  const dropdownState = useDropdown();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  // Image Editor State
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false); // false or handle name ('nw', 'n', 'ne', etc.)
  const [transformStart, setTransformStart] = useState(null); // { mouseX, mouseY, elX, elY, elW, elH, elFontSize }
  const [editingTextId, setEditingTextId] = useState(null);
  const [scale, setScale] = useState(0.5); // Default to 0.5 (400px width) until measured
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchWelcomeData = async () => {
      try {
        const [welcomeData, channelsData, rolesData] = await Promise.all([
          api.get(`/welcome/${id}`),
          api.get(`/guilds/${id}/channels`),
          api.get(`/guilds/${id}/roles`),
        ]);

        const normalizedSettings = {
          welcome: {
            enabled: !!welcomeData?.welcome?.enabled,
            channel: welcomeData?.welcome?.channel || null,
            message: welcomeData?.welcome?.message || "",
          },
          goodbye: {
            enabled: !!welcomeData?.goodbye?.enabled,
            channel: welcomeData?.goodbye?.channel || null,
            message: welcomeData?.goodbye?.message || "",
          },
          welcomeImage: {
            enabled: !!welcomeData?.welcomeImage?.enabled,
            background: welcomeData?.welcomeImage?.background || "",
            elements: Array.isArray(welcomeData?.welcomeImage?.elements)
              ? welcomeData.welcomeImage.elements
              : [],
          },
        };

        setSettings(normalizedSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(normalizedSettings)));
        setChannels(Array.isArray(channelsData) ? channelsData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } catch (err) {
        err.isApiError = true;
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWelcomeData();
  }, [id]);

  useEffect(() => {
    const updateScale = () => {
      if (editorRef.current) {
        const { width } = editorRef.current.getBoundingClientRect();
        setScale(width / 800);
      }
    };

    // Initial update
    updateScale();
    // Update on resize
    window.addEventListener("resize", updateScale);
    // Update after a small delay to ensure layout is settled
    const timeout = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timeout);
    };
  }, []);

  const handleMouseDown = (e, id) => {
    e.stopPropagation();
    const el = settings.welcomeImage.elements.find((e) => e.id === id);
    if (!el) return;

    setSelectedElement(id);
    setIsDragging(true);
    setTransformStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width || 0,
      elH: el.height || 0,
      elFontSize: el.fontSize || 0,
    });
  };

  const handleResizeStart = (e, id, handle) => {
    e.stopPropagation();
    e.preventDefault();
    const el = settings.welcomeImage.elements.find((e) => e.id === id);
    if (!el) return;

    setSelectedElement(id);
    setIsResizing(handle);
    setTransformStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width || 0,
      elH: el.height || 0,
      elFontSize: el.fontSize || 0,
    });
  };

  const handleMouseMove = (e) => {
    if (
      (!isDragging && !isResizing) ||
      !selectedElement ||
      !editorRef.current ||
      !transformStart
    )
      return;

    const rect = editorRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 450 / rect.height;

    if (isDragging) {
      const mouseDX = (e.clientX - transformStart.mouseX) * scaleX;
      const mouseDY = (e.clientY - transformStart.mouseY) * scaleY;

      updateElement(selectedElement, {
        x: Math.round(transformStart.elX + mouseDX),
        y: Math.round(transformStart.elY + mouseDY),
      });
    } else if (isResizing) {
      const el = settings.welcomeImage.elements.find(
        (e) => e.id === selectedElement,
      );
      if (!el) return;

      const mouseDX = (e.clientX - transformStart.mouseX) * scaleX;
      const mouseDY = (e.clientY - transformStart.mouseY) * scaleY;

      if (el.type === "text") {
        // Text resize: scale font size based on diagonal drag
        const newFontSize = Math.max(
          10,
          transformStart.elFontSize + mouseDX / 2,
        );
        updateElement(selectedElement, {
          fontSize: Math.round(newFontSize),
        });
      } else {
        // Avatar resize
        let dW = 0;
        let dH = 0;
        let dX = 0;
        let dY = 0;

        if (isResizing.includes("e")) dW = mouseDX;
        if (isResizing.includes("w")) {
          dW = -mouseDX;
          dX = mouseDX;
        }
        if (isResizing.includes("s")) dH = mouseDY;
        if (isResizing.includes("n")) {
          dH = -mouseDY;
          dY = mouseDY;
        }

        let newW = Math.max(20, transformStart.elW + dW);
        let newH = Math.max(20, transformStart.elH + dH);
        let newX = transformStart.elX + dX;
        let newY = transformStart.elY + dY;

        // Aspect ratio lock
        if (
          el.maintainRatio &&
          transformStart.elW > 0 &&
          transformStart.elH > 0
        ) {
          const ratio = transformStart.elW / transformStart.elH;
          if (isResizing === "n" || isResizing === "s") {
            newW = newH * ratio;
          } else {
            newH = newW / ratio;
          }
        }

        updateElement(selectedElement, {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newW),
          height: Math.round(newH),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("pointermove", handleMouseMove);
      window.addEventListener("pointerup", handleMouseUp);
    } else {
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("pointerup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("pointerup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, isResizing]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [welcomeData, channelsData, rolesData] = await Promise.all([
          api.get(`/welcome/${id}`),
          api.get(`/guilds/${id}/channels`),
          api.get(`/guilds/${id}/roles`),
        ]);

        setChannels(Array.isArray(channelsData) ? channelsData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);

        // Normalize Data
        const normalizedSettings = {
          welcome: {
            enabled: welcomeData.welcome?.enabled || false,
            message:
              welcomeData.welcome?.message || "Welcome [user] to [server]!",
            delivery: welcomeData.welcome?.delivery || "channel",
            channel: welcomeData.welcome?.channel || "",
            autorole: {
              enabled: welcomeData.welcome?.autorole?.enabled ?? false,
              roles: welcomeData.welcome?.autorole?.roles ?? [],
            },
          },
          welcomeImage: {
            enabled: welcomeData.welcomeImage?.enabled || false,
            delivery: welcomeData.welcomeImage?.delivery || "with_text",
            channel: welcomeData.welcomeImage?.channel || "",
            background: welcomeData.welcomeImage?.background || "",
            bgMode: welcomeData.welcomeImage?.bgMode || "stretch",
            elements:
              welcomeData.welcomeImage?.elements &&
              welcomeData.welcomeImage.elements.length > 0
                ? welcomeData.welcomeImage.elements
                : [
                    {
                      id: 1,
                      type: "avatar",
                      x: 305,
                      y: 80,
                      width: 190,
                      height: 190,
                      radius: 50,
                      maintainRatio: true,
                    },
                    {
                      id: 2,
                      type: "text",
                      content: "[userName]",
                      x: 400,
                      y: 300,
                      color: "#ffffff",
                      fontSize: 48,
                      align: "center",
                      style: "bold",
                      fontFamily: "sans-serif",
                      strokeColor: "#000000",
                      strokeWidth: 0,
                      shadowColor: "#000000",
                      shadowBlur: 0,
                      shadowOffsetX: 2,
                      shadowOffsetY: 2,
                    },
                    {
                      id: 3,
                      type: "text",
                      content: "Welcome to [server]",
                      x: 400,
                      y: 360,
                      color: "#cccccc",
                      fontSize: 32,
                      align: "center",
                      style: "normal",
                      fontFamily: "sans-serif",
                      strokeColor: "#000000",
                      strokeWidth: 0,
                      shadowColor: "#000000",
                      shadowBlur: 0,
                      shadowOffsetX: 2,
                      shadowOffsetY: 2,
                    },
                  ],
          },
          goodbye: {
            enabled: welcomeData.goodbye?.enabled || false,
            message: welcomeData.goodbye?.message || "Goodbye [user]!",
            channel: welcomeData.goodbye?.channel || "",
          },
        };

        setSettings(normalizedSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(normalizedSettings)));
      } catch (err) {
        console.error("Failed to load welcomer settings:", err);
        err.isApiError = true;
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  if (errorVisible) throw errorVisible;

  useEffect(() => {
    if (!settings || !originalSettings) return;
    const changed =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);

    if (changed) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [settings, originalSettings, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    await api.post(`/welcome/${id}`, settings);
    setOriginalSettings(JSON.parse(JSON.stringify(settings)));
  }, [id, settings]);

  const handleReset = useCallback(() => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
  }, [originalSettings]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  // Helper to update nested state
  const updateSettings = (section, path, value) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      let current = newSettings[section];
      const keys = path.split(".");
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  // Image Editor Helpers
  const addElement = (type) => {
    const newElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      ...(type === "text"
        ? {
            content: "New Text",
            color: "#ffffff",
            fontSize: 40,
            align: "left",
            style: "normal",
            fontFamily: "sans-serif",
            strokeColor: "#000000",
            strokeWidth: 0,
            shadowColor: "#000000",
            shadowBlur: 0,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          }
        : {
            width: 150,
            height: 150,
            radius: 50,
            maintainRatio: true,
          }),
    };
    setSettings((prev) => ({
      ...prev,
      welcomeImage: {
        ...prev.welcomeImage,
        elements: [...prev.welcomeImage.elements, newElement],
      },
    }));
    setSelectedElement(newElement.id);
  };

  const updateElement = (id, updates) => {
    setSettings((prev) => ({
      ...prev,
      welcomeImage: {
        ...prev.welcomeImage,
        elements: prev.welcomeImage.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el,
        ),
      },
    }));
  };

  const removeElement = (id) => {
    setSettings((prev) => ({
      ...prev,
      welcomeImage: {
        ...prev.welcomeImage,
        elements: prev.welcomeImage.elements.filter((el) => el.id !== id),
      },
    }));
    setSelectedElement(null);
  };

  const resetToDefault = () => {
    setSettings((prev) => ({
      ...prev,
      welcomeImage: {
        ...prev.welcomeImage,
        background: "",
        bgMode: "stretch",
        elements: [
          {
            id: Math.random().toString(36).substr(2, 9),
            type: "avatar",
            x: 305,
            y: 80,
            width: 190,
            height: 190,
            radius: 50,
            maintainRatio: true,
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            type: "text",
            content: "[userName]",
            x: 400,
            y: 300,
            color: "#ffffff",
            fontSize: 48,
            align: "center",
            style: "bold",
            fontFamily: "sans-serif",
            strokeColor: "#000000",
            strokeWidth: 0,
            shadowColor: "#000000",
            shadowBlur: 0,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
          {
            id: Math.random().toString(36).substr(2, 9),
            type: "text",
            content: "Welcome to [server]",
            x: 400,
            y: 360,
            color: "#cccccc",
            fontSize: 32,
            align: "center",
            style: "normal",
            fontFamily: "sans-serif",
            strokeColor: "#000000",
            strokeWidth: 0,
            shadowColor: "#000000",
            shadowBlur: 0,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
        ],
      },
    }));
    setSelectedElement(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSettings("welcomeImage", "background", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Welcomer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-32 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome & Goodbye
            </h1>
            <p className="text-gray-400">
              Manage how your bot greets new members and says goodbye.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-1 overflow-x-auto no-scrollbar">
            {[
              { id: "welcome", label: "Welcome Message", icon: UserPlus },
              { id: "image", label: "Welcome Image", icon: ImageIcon },
              { id: "goodbye", label: "Goodbye Message", icon: LogOut },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-6 py-3 rounded-t-xl flex items-center gap-2 font-medium transition-all whitespace-nowrap ${
                  activeSection === tab.id
                    ? "bg-white/10 text-white border-b-2 border-primary"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="space-y-8">
            {/* WELCOME SECTION */}
            {activeSection === "welcome" && (
              <div className="animate-fade-in-up space-y-6">
                {/* Enable Toggle */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Enable Welcome System
                    </h3>
                    <p className="text-sm text-gray-400">
                      Send a custom message when a user joins
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings(
                        "welcome",
                        "enabled",
                        !settings.welcome.enabled,
                      )
                    }
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      settings.welcome.enabled ? "bg-primary" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${
                        settings.welcome.enabled ? "left-8" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {settings.welcome.enabled && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Message Input */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <MessageSquare size={16} className="text-primary" />
                          Welcome Message
                        </label>
                        <textarea
                          value={settings.welcome.message}
                          onChange={(e) =>
                            updateSettings("welcome", "message", e.target.value)
                          }
                          className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                          placeholder="Welcome [user] to [server]!"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {[
                            "[user]",
                            "[userName]",
                            "[memberCount]",
                            "[server]",
                          ].map((v) => (
                            <code
                              key={v}
                              className="px-2 py-1 bg-white/10 rounded text-xs text-primary font-mono cursor-pointer hover:bg-white/20"
                              onClick={() =>
                                updateSettings(
                                  "welcome",
                                  "message",
                                  settings.welcome.message + " " + v,
                                )
                              }
                            >
                              {v}
                            </code>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Method */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <label className="block text-sm font-semibold text-gray-300 mb-4">
                          Delivery Method
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            {
                              id: "dm",
                              label: "Direct Message",
                              desc: "Send to user's DM",
                            },
                            {
                              id: "channel",
                              label: "Server Channel",
                              desc: "Send to a channel",
                            },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() =>
                                updateSettings("welcome", "delivery", opt.id)
                              }
                              className={`p-4 rounded-xl border text-left transition-all ${
                                settings.welcome.delivery === opt.id
                                  ? "bg-primary/10 border-primary text-white"
                                  : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5"
                              }`}
                            >
                              <div className="font-semibold">{opt.label}</div>
                              <div className="text-xs opacity-70">
                                {opt.desc}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Channel Selector */}
                      {settings.welcome.delivery === "channel" && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                          <GenericSelector
                            label="Welcome Channel"
                            value={settings.welcome.channel}
                            options={channels}
                            onChange={(val) =>
                              updateSettings("welcome", "channel", val)
                            }
                            dropdownId="welcome-channel"
                            dropdownState={dropdownState}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            * If no channel is selected, the bot will try the
                            System Channel, then the first available text
                            channel.
                          </p>
                        </div>
                      )}

                      {/* Auto Role */}
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                            <Settings size={16} className="text-primary" />
                            Auto-Role
                          </label>
                          <button
                            onClick={() =>
                              updateSettings(
                                "welcome",
                                "autorole.enabled",
                                !settings.welcome.autorole.enabled,
                              )
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${
                              settings?.welcome?.autorole?.enabled
                                ? "bg-primary"
                                : "bg-gray-700"
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                                settings?.welcome?.autorole?.enabled
                                  ? "left-6"
                                  : "left-1"
                              }`}
                            />
                          </button>
                        </div>

                        {settings?.welcome?.autorole?.enabled && (
                          <GenericSelector
                            label="Roles to Assign"
                            value={settings?.welcome?.autorole?.roles}
                            options={roles}
                            onChange={(val) =>
                              updateSettings("welcome", "autorole.roles", val)
                            }
                            placeholder="Select roles..."
                            type="multi"
                            dropdownId="autorole-roles"
                            dropdownState={dropdownState}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* IMAGE SECTION */}
            {activeSection === "image" && (
              <div className="animate-fade-in-up space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Enable Welcome Image
                    </h3>
                    <p className="text-sm text-gray-400">
                      Generate a custom image for new members
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings(
                        "welcomeImage",
                        "enabled",
                        !settings.welcomeImage.enabled,
                      )
                    }
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      settings.welcomeImage.enabled
                        ? "bg-primary"
                        : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${
                        settings.welcomeImage.enabled ? "left-8" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {settings.welcomeImage.enabled && (
                  <div className="space-y-6">
                    {/* Delivery Options */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <label className="block text-sm font-semibold text-gray-300 mb-4">
                        Image Delivery
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { id: "with_text", label: "With Text" },
                          { id: "before_text", label: "Before Text" },
                          { id: "channel", label: "Specific Channel" },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() =>
                              updateSettings("welcomeImage", "delivery", opt.id)
                            }
                            className={`px-4 py-2 rounded-lg border transition-all ${
                              settings.welcomeImage.delivery === opt.id
                                ? "bg-primary text-white border-primary"
                                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {settings.welcomeImage.delivery === "channel" && (
                        <div className="mt-4 max-w-md">
                          <GenericSelector
                            label="Image Channel"
                            value={settings.welcomeImage.channel}
                            options={channels}
                            onChange={(val) =>
                              updateSettings("welcomeImage", "channel", val)
                            }
                            dropdownId="image-channel"
                            dropdownState={dropdownState}
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            * If no channel is selected, the bot will try the
                            System Channel, then the first available text
                            channel.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Editor */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                        <h3 className="font-bold text-white flex items-center gap-2">
                          <ImageIcon size={20} className="text-primary" />
                          Image Editor
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addElement("text")}
                            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Type size={14} /> Add Text
                          </button>
                          <button
                            onClick={() => addElement("avatar")}
                            disabled={settings.welcomeImage.elements.some(
                              (el) => el.type === "avatar",
                            )}
                            className={`btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 ${
                              settings.welcomeImage.elements.some(
                                (el) => el.type === "avatar",
                              )
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <User size={14} /> Add Avatar
                          </button>
                          <button
                            onClick={resetToDefault}
                            className="relative group text-xs py-1.5 px-3 flex items-center gap-1.5 rounded-lg font-medium transition-all duration-300 overflow-hidden bg-gradient-to-r from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/20 hover:scale-105"
                          >
                            <RotateCcw
                              size={14}
                              className="group-hover:rotate-180 transition-transform duration-500"
                            />
                            <span>Reset to Default</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Canflovas Area */}
                        <div className="lg:col-span-2">
                          <div
                            ref={editorRef}
                            className="relative w-full aspect-video bg-[#161616] rounded-xl overflow-hidden border border-white/20 select-none touch-none"
                            onPointerDown={() => setSelectedElement(null)}
                            style={{
                              backgroundImage: settings.welcomeImage.background
                                ? `url(${settings.welcomeImage.background})`
                                : "none",
                              backgroundSize:
                                settings.welcomeImage.bgMode === "contain"
                                  ? "contain"
                                  : settings.welcomeImage.bgMode === "stretch"
                                  ? "100% 100%"
                                  : "cover",
                              backgroundPosition: "center",
                              backgroundRepeat: "no-repeat",
                            }}
                          >
                            {settings.welcomeImage.elements.map((el) => (
                              <div
                                key={el.id}
                                onPointerDown={(e) => handleMouseDown(e, el.id)}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  if (el.type === "text") {
                                    setEditingTextId(el.id);
                                    // Small delay to focus input
                                    setTimeout(() => {
                                      const input = document.getElementById(
                                        `text-input-${el.id}`,
                                      );
                                      if (input) {
                                        input.focus();
                                        input.select();
                                      }
                                    }, 10);
                                  }
                                }}
                                className={`absolute group select-none ${
                                  selectedElement === el.id ? "z-50" : "z-10"
                                }`}
                                style={{
                                  // Position Logic
                                  // For Avatar: x,y is Top-Left.
                                  // For Text: x,y is Anchor Point.
                                  left: `${(el.x / 800) * 100}%`,
                                  top: `${(el.y / 450) * 100}%`,

                                  // Sizing for Avatar
                                  width:
                                    el.type === "avatar"
                                      ? `${(el.width / 800) * 100}%`
                                      : "auto",
                                  height:
                                    el.type === "avatar"
                                      ? `${(el.height / 450) * 100}%`
                                      : "auto",

                                  // Transform for Text Alignment
                                  transform:
                                    el.type === "text"
                                      ? `translate(${
                                          el.align === "center"
                                            ? "-50%"
                                            : el.align === "right"
                                            ? "-100%"
                                            : "0%"
                                        }, -50%)`
                                      : "none",
                                  // Text Y is vertical middle anchor usually

                                  cursor: isDragging ? "grabbing" : "grab",
                                  touchAction: "none",
                                }}
                              >
                                {el.type === "text" ? (
                                  editingTextId === el.id ? (
                                    <input
                                      id={`text-input-${el.id}`}
                                      type="text"
                                      value={el.content}
                                      onChange={(e) =>
                                        updateElement(el.id, {
                                          content: e.target.value,
                                        })
                                      }
                                      onBlur={() => setEditingTextId(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          setEditingTextId(null);
                                      }}
                                      className="bg-transparent border-none outline-none p-0 m-0 w-auto min-w-[50px] whitespace-nowrap"
                                      style={{
                                        color: el.color,
                                        fontSize: `${el.fontSize * scale}px`,
                                        fontFamily:
                                          el.fontFamily || "sans-serif",
                                        fontWeight:
                                          el.style === "bold"
                                            ? "bold"
                                            : "normal",
                                        fontStyle:
                                          el.style === "italic"
                                            ? "italic"
                                            : "normal",
                                        textAlign: el.align || "left",
                                        // Text Shadow & Stroke simulation in input is hard, simpler preview:
                                        textShadow: el.shadowBlur
                                          ? `${el.shadowOffsetX || 2}px ${
                                              el.shadowOffsetY || 2
                                            }px ${el.shadowBlur}px ${
                                              el.shadowColor
                                            }`
                                          : "none",
                                      }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        color: el.color,
                                        fontSize: `${el.fontSize * scale}px`,
                                        fontFamily:
                                          el.fontFamily || "sans-serif",
                                        fontWeight:
                                          el.style === "bold"
                                            ? "bold"
                                            : "normal",
                                        fontStyle:
                                          el.style === "italic"
                                            ? "italic"
                                            : "normal",
                                        whiteSpace: "nowrap",
                                        userSelect: "none",
                                        // Advanced Styling
                                        textShadow: el.shadowBlur
                                          ? `${el.shadowOffsetX || 2}px ${
                                              el.shadowOffsetY || 2
                                            }px ${el.shadowBlur}px ${
                                              el.shadowColor
                                            }`
                                          : "none",
                                        WebkitTextStroke: el.strokeWidth
                                          ? `${
                                              el.strokeWidth * (scale || 1)
                                            }px ${el.strokeColor}`
                                          : "0",
                                      }}
                                    >
                                      {el.content}
                                    </div>
                                  )
                                ) : (
                                  <div
                                    className="w-full h-full overflow-hidden bg-gray-700/50"
                                    style={{
                                      borderRadius: `${el.radius || 0}%`,
                                    }}
                                  >
                                    <Image
                                      src="https://cdn.discordapp.com/embed/avatars/0.png"
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                      width={100}
                                      height={100}
                                    />
                                  </div>
                                )}

                                {/* Selection UI */}
                                {selectedElement === el.id &&
                                  !editingTextId && (
                                    <>
                                      {/* Bounding Box Border */}
                                      <div className="absolute -inset-1 border-2 border-primary border-dashed rounded-sm pointer-events-none" />

                                      {/* Resize Handles */}
                                      {/* For Text, maybe just one handle? Or corners? */}
                                      {/* For Avatar, all corners and sides */}

                                      <div
                                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-se-resize z-20"
                                        onPointerDown={(e) =>
                                          handleResizeStart(e, el.id, "se")
                                        }
                                      />

                                      {el.type === "avatar" && (
                                        <>
                                          <div
                                            className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nw-resize z-20"
                                            onPointerDown={(e) =>
                                              handleResizeStart(e, el.id, "nw")
                                            }
                                          />
                                          <div
                                            className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-ne-resize z-20"
                                            onPointerDown={(e) =>
                                              handleResizeStart(e, el.id, "ne")
                                            }
                                          />
                                          <div
                                            className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-primary rounded-full cursor-sw-resize z-20"
                                            onPointerDown={(e) =>
                                              handleResizeStart(e, el.id, "sw")
                                            }
                                          />
                                        </>
                                      )}
                                    </>
                                  )}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 justify-center">
                            <span className="text-xs text-gray-500 mr-2">
                              Variables:
                            </span>
                            {[
                              "[user]",
                              "[userName]",
                              "[memberCount]",
                              "[server]",
                            ].map((v) => (
                              <code
                                key={v}
                                className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-primary font-mono"
                              >
                                {v}
                              </code>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            * Double-click text to edit directly. Drag to move.
                            Use handles to resize.
                          </p>
                        </div>

                        {/* Properties Panel */}
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5 h-full">
                          {selectedElement ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                <span className="text-sm font-bold text-white">
                                  Edit Element
                                </span>
                                <button
                                  onClick={() => removeElement(selectedElement)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {/* Layer Controls */}
                              <div className="flex gap-2 mb-4">
                                <button
                                  onClick={() => {
                                    const els = [
                                      ...settings.welcomeImage.elements,
                                    ];
                                    const idx = els.findIndex(
                                      (e) => e.id === selectedElement,
                                    );
                                    if (idx < els.length - 1) {
                                      const el = els.splice(idx, 1)[0];
                                      els.push(el); // Move to end (Front)
                                      updateSettings(
                                        "welcomeImage",
                                        "elements",
                                        els,
                                      );
                                    }
                                  }}
                                  className="flex-1 bg-white/5 hover:bg-white/10 text-xs py-1.5 rounded text-gray-300 transition-colors"
                                >
                                  Bring to Front
                                </button>
                                <button
                                  onClick={() => {
                                    const els = [
                                      ...settings.welcomeImage.elements,
                                    ];
                                    const idx = els.findIndex(
                                      (e) => e.id === selectedElement,
                                    );
                                    if (idx > 0) {
                                      const el = els.splice(idx, 1)[0];
                                      els.unshift(el); // Move to start (Back)
                                      updateSettings(
                                        "welcomeImage",
                                        "elements",
                                        els,
                                      );
                                    }
                                  }}
                                  className="flex-1 bg-white/5 hover:bg-white/10 text-xs py-1.5 rounded text-gray-300 transition-colors"
                                >
                                  Send to Back
                                </button>
                              </div>

                              {(() => {
                                const el = settings.welcomeImage.elements.find(
                                  (e) => e.id === selectedElement,
                                );
                                if (!el) return null;
                                return (
                                  <>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-xs text-gray-400">
                                          X Position
                                        </label>
                                        <input
                                          type="number"
                                          value={el.x}
                                          onChange={(e) =>
                                            updateElement(el.id, {
                                              x: parseInt(e.target.value),
                                            })
                                          }
                                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-400">
                                          Y Position
                                        </label>
                                        <input
                                          type="number"
                                          value={el.y}
                                          onChange={(e) =>
                                            updateElement(el.id, {
                                              y: parseInt(e.target.value),
                                            })
                                          }
                                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                        />
                                      </div>
                                    </div>

                                    {el.type === "text" && (
                                      <>
                                        <div>
                                          <label className="text-xs text-gray-400">
                                            Content
                                          </label>
                                          <input
                                            type="text"
                                            value={el.content}
                                            onChange={(e) =>
                                              updateElement(el.id, {
                                                content: e.target.value,
                                              })
                                            }
                                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-xs text-gray-400">
                                              Size (px)
                                            </label>
                                            <input
                                              type="number"
                                              value={el.fontSize}
                                              onChange={(e) =>
                                                updateElement(el.id, {
                                                  fontSize: parseInt(
                                                    e.target.value,
                                                  ),
                                                })
                                              }
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-400">
                                              Color
                                            </label>
                                            <input
                                              type="color"
                                              value={el.color}
                                              onChange={(e) =>
                                                updateElement(el.id, {
                                                  color: e.target.value,
                                                })
                                              }
                                              className="w-full h-8 bg-transparent cursor-pointer"
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs text-gray-400 mb-1 block">
                                            Style
                                          </label>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() =>
                                                updateElement(el.id, {
                                                  style: "bold",
                                                })
                                              }
                                              className={`p-2 rounded border ${
                                                el.style === "bold"
                                                  ? "bg-primary border-primary"
                                                  : "bg-white/5 border-white/10"
                                              }`}
                                            >
                                              <Bold size={14} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                updateElement(el.id, {
                                                  style: "italic",
                                                })
                                              }
                                              className={`p-2 rounded border ${
                                                el.style === "italic"
                                                  ? "bg-primary border-primary"
                                                  : "bg-white/5 border-white/10"
                                              }`}
                                            >
                                              <Italic size={14} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                updateElement(el.id, {
                                                  style: "normal",
                                                })
                                              }
                                              className={`p-2 rounded border ${
                                                el.style === "normal"
                                                  ? "bg-primary border-primary"
                                                  : "bg-white/5 border-white/10"
                                              } text-xs px-3`}
                                            >
                                              Normal
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {el.type === "avatar" && (
                                      <div className="space-y-3">
                                        <div>
                                          <label className="text-xs text-gray-400 flex justify-between">
                                            <span>Border Radius</span>
                                            <span>{el.radius || 0}%</span>
                                          </label>
                                          <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={el.radius || 0}
                                            onChange={(e) =>
                                              updateElement(el.id, {
                                                radius: parseInt(
                                                  e.target.value,
                                                ),
                                              })
                                            }
                                            className="w-full mt-1 accent-primary"
                                          />
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={el.maintainRatio !== false}
                                            onChange={(e) =>
                                              updateElement(el.id, {
                                                maintainRatio: e.target.checked,
                                              })
                                            }
                                            className="rounded bg-white/10 border-white/20"
                                          />
                                          <label className="text-xs text-gray-400">
                                            Maintain Aspect Ratio
                                          </label>
                                        </div>
                                      </div>
                                    )}

                                    {el.type === "text" && (
                                      <div className="space-y-3">
                                        {/* Stroke */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-xs text-gray-400">
                                              Stroke Color
                                            </label>
                                            <input
                                              type="color"
                                              value={
                                                el.strokeColor || "#000000"
                                              }
                                              onChange={(e) =>
                                                updateElement(el.id, {
                                                  strokeColor: e.target.value,
                                                })
                                              }
                                              className="w-full h-6 bg-transparent cursor-pointer"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-400">
                                              Stroke Width
                                            </label>
                                            <input
                                              type="number"
                                              value={el.strokeWidth || 0}
                                              onChange={(e) =>
                                                updateElement(el.id, {
                                                  strokeWidth: parseInt(
                                                    e.target.value,
                                                  ),
                                                })
                                              }
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                            />
                                          </div>
                                        </div>
                                        {/* Shadow */}
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="text-xs text-gray-400">
                                              Shadow Color
                                            </label>
                                            <input
                                              type="color"
                                              value={
                                                el.shadowColor || "#000000"
                                              }
                                              onChange={(e) =>
                                                updateElement(el.id, {
                                                  shadowColor: e.target.value,
                                                })
                                              }
                                              className="w-full h-6 bg-transparent cursor-pointer"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-xs text-gray-400">
                                              Shadow Blur
                                            </label>
                                            <input
                                              type="number"
                                              value={el.shadowBlur || 0}
                                              onChange={(e) =>
                                                updateElement(el.id, {
                                                  shadowBlur: parseInt(
                                                    e.target.value,
                                                  ),
                                                })
                                              }
                                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              Select an element to edit
                            </div>
                          )}

                          <div className="mt-6 pt-4 border-t border-white/10">
                            <label className="block text-xs font-semibold text-gray-400 mb-2">
                              Background Image
                            </label>

                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={
                                    settings.welcomeImage.background?.startsWith(
                                      "data:",
                                    )
                                      ? "Uploaded Image"
                                      : settings.welcomeImage.background || ""
                                  }
                                  readOnly={settings.welcomeImage.background?.startsWith(
                                    "data:",
                                  )}
                                  onChange={(e) =>
                                    !settings.welcomeImage.background?.startsWith(
                                      "data:",
                                    ) &&
                                    updateSettings(
                                      "welcomeImage",
                                      "background",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Image URL..."
                                  className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-primary/50"
                                />
                                {settings.welcomeImage.background && (
                                  <button
                                    onClick={() =>
                                      updateSettings(
                                        "welcomeImage",
                                        "background",
                                        "",
                                      )
                                    }
                                    className="px-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>

                              {/* Background Options */}
                              {settings.welcomeImage.background && (
                                <div className="flex gap-2 p-2 bg-white/5 rounded-lg">
                                  {["stretch", "contain", "cover"].map(
                                    (mode) => (
                                      <button
                                        key={mode}
                                        onClick={() =>
                                          updateSettings(
                                            "welcomeImage",
                                            "bgMode",
                                            mode,
                                          )
                                        }
                                        className={`flex-1 text-xs py-1 rounded capitalize ${
                                          settings.welcomeImage.bgMode === mode
                                            ? "bg-primary text-white"
                                            : "text-gray-400 hover:text-white"
                                        }`}
                                      >
                                        {mode}
                                      </button>
                                    ),
                                  )}
                                </div>
                              )}

                              <div className="relative">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleImageUpload}
                                  accept="image/*"
                                  className="hidden"
                                />
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full py-2 bg-white/5 border border-dashed border-white/20 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:border-primary/50 transition-all flex items-center justify-center gap-2"
                                >
                                  <Upload size={14} />
                                  Upload Image
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* GOODBYE SECTION */}
            {activeSection === "goodbye" && (
              <div className="animate-fade-in-up space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Enable Goodbye System
                    </h3>
                    <p className="text-sm text-gray-400">
                      Send a message when a user leaves
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSettings(
                        "goodbye",
                        "enabled",
                        !settings.goodbye.enabled,
                      )
                    }
                    className={`w-14 h-7 rounded-full transition-all relative ${
                      settings.goodbye.enabled ? "bg-primary" : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${
                        settings.goodbye.enabled ? "left-8" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {settings.goodbye.enabled && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <label className="block text-sm font-semibold text-gray-300 mb-3">
                        Goodbye Message
                      </label>
                      <textarea
                        value={settings.goodbye.message}
                        onChange={(e) =>
                          updateSettings("goodbye", "message", e.target.value)
                        }
                        className="w-full h-40 bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
                        placeholder="Goodbye [user]!"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          "[user]",
                          "[userName]",
                          "[memberCount]",
                          "[server]",
                        ].map((v) => (
                          <code
                            key={v}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-primary font-mono cursor-pointer hover:bg-white/20"
                            onClick={() =>
                              updateSettings(
                                "goodbye",
                                "message",
                                settings.goodbye.message + " " + v,
                              )
                            }
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <GenericSelector
                        label="Goodbye Channel"
                        value={settings.goodbye.channel}
                        options={channels}
                        onChange={(val) =>
                          updateSettings("goodbye", "channel", val)
                        }
                        dropdownId="goodbye-channel"
                        dropdownState={dropdownState}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        * If no channel is selected, the bot will try the System
                        Channel, then the first available text channel.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
