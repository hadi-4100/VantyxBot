"use client";
import { useEffect, useState, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";

import { api } from "@/utils/api";
import {
  Gift,
  Settings,
  Plus,
  Trash2,
  Square,
  RefreshCw,
  Save,
  X,
  Calendar,
  Users,
  Trophy,
  Zap,
  Shield,
  Hash,
  User,
} from "lucide-react";
import { useDropdownPortal } from "@/hooks/useDropdown";
import {
  GenericSelector,
  MultiSelector,
  ChannelSelector,
  RoleSelector,
} from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

const DEFAULT_SETTINGS = {
  embedColor: "#338ac4",
  endEmbedColor: "#f04747",
  reaction: "🎉",
  dmHost: false,
  dmWinners: true,
  joinButtonText: "Join Giveaway",
  winnerRole: null,
  managerRoles: [],
};

export default function GiveawaysPage({ params }) {
  const { id } = use(params);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("giveaways");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [giveaways, setGiveaways] = useState([]);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorVisible, setErrorVisible] = useState(null);
  const dropdownState = useDropdownPortal();

  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGiveaway, setEditingGiveaway] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("general"); // general, requirements
  const [modalData, setModalData] = useState({
    prize: "",
    winners: 1,
    duration: 10,
    unit: "60000",
    channelId: "",
    type: "normal",
    req_role: "",
    req_level: 0,
    req_invites: 0,
  });

  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [hosts, setHosts] = useState({}); // Cache for host user details
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update current time every second for relative timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time formatter helpers
  const formatRelativeTime = (endTime) => {
    const diff = endTime - now;
    if (diff <= 0) return "just now";

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    return `${d.getDate()}/${
      d.getMonth() + 1
    }/${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(
      2,
      "0",
    )}${d.getHours() >= 12 ? "pm" : "am"}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const [
        guildData,
        giveawaysData,
        rolesData,
        channelsData,
        emojisData,
        userData,
      ] = await Promise.all([
        api.get(`/guilds/${id}`),
        api.get(`/giveaways/${id}`),
        api.get(`/guilds/${id}/roles`),
        api.get(`/guilds/${id}/channels`),
        api.get(`/guilds/${id}/emojis`),
        api.get("/auth/user"),
      ]);

      setUser(userData);

      // Merge defaults with DB data
      const mergedSettings = {
        ...DEFAULT_SETTINGS,
        ...(guildData.giveaways || {}),
        managerRoles: guildData.giveaways?.managerRoles || [],
      };
      setSettings(mergedSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(mergedSettings)));

      setGiveaways(giveawaysData);
      setRoles(rolesData);
      setChannels(channelsData);
      setEmojis(emojisData);
    } catch (err) {
      console.error(err);
      setErrorVisible(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (errorVisible) throw errorVisible;

  // Fetch host details when giveaways change
  useEffect(() => {
    const fetchHosts = async () => {
      if (!giveaways.length) return;

      const uniqueHostIds = [
        ...new Set(giveaways.map((g) => g.hostedBy)),
      ].filter(
        (hostId) =>
          hostId &&
          hostId !== "Dashboard" &&
          hostId !== "Dashboard User" &&
          hostId !== user?.id &&
          !hosts[hostId],
      );

      if (uniqueHostIds.length === 0) return;

      try {
        await Promise.all(
          uniqueHostIds.map(async (hostId) => {
            try {
              const data = await api.get(`/guilds/${id}/members/${hostId}`);
              const userData = data.user || data;
              const name =
                data.nick || userData.global_name || userData.username;
              setHosts((prev) => ({
                ...prev,
                [hostId]: { ...userData, displayName: name },
              }));
            } catch (err) {
              console.error(`Failed to fetch host ${hostId}:`, err);
            }
          }),
        );
      } catch (err) {
        console.error("Failed to fetch hosts:", err);
      }
    };

    fetchHosts();
  }, [giveaways, id, user?.id, hosts]);

  // Dirty state detection
  useEffect(() => {
    if (!settings || !originalSettings) return;

    const currentData = JSON.stringify(settings);
    const hasChanges = currentData !== JSON.stringify(originalSettings);

    if (hasChanges) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [settings, originalSettings, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    if (!settings.joinButtonText || settings.joinButtonText.trim() === "") {
      throw new Error("Join Button Text cannot be empty");
    }
    if (settings.joinButtonText.length > 40) {
      throw new Error("Join Button Text cannot exceed 40 characters");
    }

    await api.post(`/guilds/${id}`, { giveaways: settings });
    setOriginalSettings(JSON.parse(JSON.stringify(settings)));
  }, [settings, id]);

  const handleReset = useCallback(() => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
    }
  }, [originalSettings]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  // Actions
  const handleAction = async (action, giveawayId, body = {}) => {
    try {
      if (action === "delete") {
        await api.delete(`/giveaways/${id}/${giveawayId}`);
      } else {
        await api.post(`/giveaways/${id}/${giveawayId}/${action}`, body);
      }

      toast.success(`Giveaway ${action} successfully!`);
      fetchData();
    } catch (e) {
      toast.error(`Error: ${e.message}`);
    }
  };

  const handleAddManagerRole = (roleId) => {
    if (!roleId) return;
    if (settings.managerRoles.includes(roleId)) return;
    if (settings.managerRoles.length >= 5) {
      toast.error("Max 5 manager roles allowed");
      return;
    }
    setSettings((prev) => ({
      ...prev,
      managerRoles: [...prev.managerRoles, roleId],
    }));
  };

  const handleRemoveManagerRole = (roleId) => {
    setSettings((prev) => ({
      ...prev,
      managerRoles: prev.managerRoles.filter((id) => id !== roleId),
    }));
  };

  const getEmojiUrl = (emojiStr) => {
    if (!emojiStr) return null;
    const animatedMatch = emojiStr.match(/<a:([^:]+):(\d+)>/);
    if (animatedMatch)
      return `https://cdn.discordapp.com/emojis/${animatedMatch[2]}.gif`;
    const staticMatch = emojiStr.match(/<:([^:]+):(\d+)>/);
    if (staticMatch)
      return `https://cdn.discordapp.com/emojis/${staticMatch[2]}.png`;
    return null;
  };

  const standardEmojis = [
    "🎉",
    "🎁",
    "🎫",
    "🎟",
    "✨",
    "🔥",
    "💎",
    "⭐",
    "🏆",
    "🎊",
    "💰",
    "🔔",
  ];

  const handleOpenCreateModal = () => {
    setEditingGiveaway(null);
    setModalData({
      prize: "",
      winners: 1,
      duration: 10,
      unit: "60000",
      channelId: channels[0]?.id || "",
      type: "normal",
      req_role: "",
      req_level: 0,
      req_invites: 0,
    });
    setActiveModalTab("general");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (giveaway) => {
    setEditingGiveaway(giveaway);
    setModalData({
      prize: giveaway.prize,
      winners: giveaway.winnerCount,
      duration: 0, // In edit we add/remove time or keep same? Bot logic says 'add_time'
      unit: "60000",
      channelId: giveaway.channelId,
      type: giveaway.type,
      req_role: giveaway.requirements?.role || "",
      req_level: giveaway.requirements?.level || 0,
      req_invites: giveaway.requirements?.invites || 0,
    });
    setActiveModalTab("general");
    setIsModalOpen(true);
  };

  const handleSaveGiveaway = async () => {
    setSaving(true);

    const payload = {
      prize: modalData.prize,
      winnerCount: parseInt(modalData.winners),
      channelId: modalData.channelId,
    };

    if (!editingGiveaway) {
      payload.duration =
        parseInt(modalData.duration) * parseInt(modalData.unit);
      payload.type = modalData.type;
      payload.hostedBy = user?.id;
      payload.requirements = {
        role: modalData.req_role || null,
        level: parseInt(modalData.req_level) || 0,
        invites: parseInt(modalData.req_invites) || 0,
      };
    } else {
      if (parseInt(modalData.duration) !== 0) {
        const remainingMs =
          parseInt(modalData.duration) * parseInt(modalData.unit);
        payload.endAt = Date.now() + remainingMs;
      }
    }

    try {
      if (editingGiveaway) {
        await api.patch(`/giveaways/${id}/${editingGiveaway._id}`, payload);
      } else {
        await api.post(`/giveaways/${id}/create`, payload);
      }

      toast.success(`Giveaway ${editingGiveaway ? "updated" : "created"}!`);
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e.message || "Error saving giveaway");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading giveaway system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex flex-col font-outfit">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-32 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in-up">
            <div className="relative">
              <h1 className="text-5xl md:text-6xl font-black mb-4 text-gradient flex items-center gap-4">
                <Gift size={48} className="text-blue-bright" />
                Giveaways
              </h1>
              <p className="text-gray-400 text-xl font-medium max-w-2xl">
                Engage your community with exciting events, automated rewards,
                and seamless entry management.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-10 glass p-1.5 rounded-2xl w-fit border border-white/10">
            <button
              onClick={() => setActiveTab("giveaways")}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "giveaways"
                  ? "bg-gradient-blue-glow text-white shadow-glow"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Gift size={20} /> Current Events
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                activeTab === "settings"
                  ? "bg-gradient-blue text-white shadow-glow"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Settings size={20} /> System Settings
            </button>
          </div>

          {/* Content Area */}
          <div className="animate-fade-in-up">
            {activeTab === "giveaways" && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass border border-white/10 p-8 rounded-[2rem] gap-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-1 gap-8 md:gap-16 items-center">
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        Total Events
                      </p>
                      <p className="text-4xl font-black text-white">
                        {giveaways.length}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                    <div>
                      <p className="text-blue-glow text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        Active Now
                      </p>
                      <p className="text-4xl font-black text-white">
                        {giveaways.filter((g) => !g.ended).length}
                      </p>
                    </div>
                    <div className="w-px h-12 bg-white/10 hidden md:block" />
                    <div>
                      <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        Participants
                      </p>
                      <p className="text-4xl font-black text-white">
                        {giveaways.reduce(
                          (acc, g) => acc + (g.entries?.length || 0),
                          0,
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenCreateModal}
                    className="relative z-10 flex items-center gap-3 bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl shadow-white/5 active:scale-95 whitespace-nowrap"
                  >
                    <Plus size={22} strokeWidth={3} /> Create Giveaway
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {giveaways.map((g, i) => {
                    const isEndedLocally =
                      g.type === "drop" ? g.ended : now > g.endAt || g.ended;
                    return (
                      <div
                        key={g._id}
                        className={`card-hover group relative overflow-hidden animate-fade-in-up ${
                          isEndedLocally ? "opacity-75" : ""
                        }`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {/* Status Overlay */}
                        <div
                          className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-colors duration-500 ${
                            isEndedLocally
                              ? "bg-red-500/10"
                              : "bg-blue-bright/20"
                          }`}
                        />

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex flex-wrap gap-2">
                              <div
                                className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border transition-all duration-500 ${
                                  isEndedLocally
                                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                }`}
                              >
                                {isEndedLocally ? "EVENT ENDED" : "LIVE NOW"}
                              </div>
                              {g.type === "drop" && (
                                <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5">
                                  <Zap size={10} fill="currentColor" /> DROP
                                  TYPE
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">
                              #{g._id.slice(-6)}
                            </span>
                          </div>

                          <h3 className="text-2xl font-black mb-6 line-clamp-2 text-white group-hover:text-blue-glow transition-colors leading-tight">
                            {g.prize}
                          </h3>

                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                              <p className="text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                                <Users size={12} className="text-blue-bright" />{" "}
                                Entries
                              </p>
                              <p className="text-2xl font-black text-white">
                                {g.entries?.length || 0}
                              </p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                              <p className="text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1.5">
                                <Trophy size={12} className="text-amber-400" />{" "}
                                Winners
                              </p>
                              <p className="text-2xl font-black text-white">
                                {isEndedLocally
                                  ? g.winners?.length || 0
                                  : g.winnerCount}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 mb-8">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 bg-black/20 p-3 rounded-xl border border-white/5">
                              <span className="flex items-center gap-2 uppercase tracking-tighter opacity-60">
                                <Hash size={14} /> Channel
                              </span>
                              <span className="text-blue-glow">
                                #
                                {channels.find((c) => c.id === g.channelId)
                                  ?.name || "unknown"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 bg-black/20 p-3 rounded-xl border border-white/5">
                              <span className="flex items-center gap-2 uppercase tracking-tighter opacity-60">
                                <User size={14} /> Hosted by
                              </span>
                              <span className="text-xs font-bold text-gray-300">
                                {g.hostedBy === user?.id
                                  ? "You"
                                  : hosts[g.hostedBy]?.displayName ||
                                    hosts[g.hostedBy]?.username ||
                                    g.hostedBy ||
                                    "Admin"}
                              </span>
                            </div>

                            {/* Requirements */}
                            {(g.requirements?.role ||
                              g.requirements?.level > 0 ||
                              g.requirements?.invites > 0) && (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {g.requirements?.role && (
                                  <div className="bg-blue-primary/10 text-blue-glow border border-blue-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter">
                                    <Shield size={10} />{" "}
                                    {roles.find(
                                      (r) => r.id === g.requirements.role,
                                    )?.name || "Role"}
                                  </div>
                                )}
                                {g.requirements?.level > 0 && (
                                  <div className="bg-white/5 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                    LVL {g.requirements.level}+
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-auto pt-6 border-t border-white/5">
                            <div
                              className={`flex items-center gap-3 mb-6 ${
                                isEndedLocally
                                  ? "text-gray-500"
                                  : "text-emerald-400"
                              }`}
                            >
                              <div
                                className={`w-2.5 h-2.5 rounded-full ${
                                  isEndedLocally
                                    ? "bg-gray-600"
                                    : "bg-emerald-500 animate-pulse shadow-glow-sm"
                                }`}
                              />
                              <span className="font-black text-xs uppercase tracking-widest">
                                {isEndedLocally
                                  ? `Ended ${formatDateTime(g.endAt)}`
                                  : g.type === "drop"
                                  ? "Active Until Claimed"
                                  : `ENDS IN ${formatRelativeTime(g.endAt)}`}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {!isEndedLocally ? (
                                <>
                                  <button
                                    onClick={() => handleOpenEditModal(g)}
                                    className="flex-1 bg-white/5 text-blue-glow py-3 rounded-xl hover:bg-blue-primary hover:text-white transition-all flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] border border-white/5"
                                  >
                                    <Settings size={14} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleAction("end", g._id)}
                                    className="flex-1 bg-white/5 text-red-400 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] border border-white/5"
                                  >
                                    <Square size={14} fill="currentColor" />{" "}
                                    Finish
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleAction("reroll", g._id)}
                                  className="flex-1 bg-gradient-blue-glow text-white py-3 rounded-xl shadow-glow hover:shadow-glow-lg transition-all flex justify-center items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em]"
                                >
                                  <RefreshCw size={14} /> Reroll Winners
                                </button>
                              )}
                              <button
                                onClick={() => handleAction("delete", g._id)}
                                className="w-12 bg-white/5 text-gray-500 py-3 rounded-xl hover:bg-red-600 hover:text-white transition-all flex justify-center items-center border border-white/5"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Create New Card (Empty State) */}
                  <button
                    onClick={handleOpenCreateModal}
                    className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-6 hover:border-blue-400 hover:bg-blue-400/5 transition-all flex flex-col justify-center items-center group min-h-[300px] cursor-pointer text-gray-500 hover:text-blue-400"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-1">
                      Create New Giveaway
                    </h3>
                    <p className="text-sm opacity-60">
                      Launch a new event instantly
                    </p>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "settings" && settings && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Configuration Card */}
                <div className="bg-abyss/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md h-fit">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Settings size={22} className="text-purple-400" /> General
                    Settings
                  </h3>
                  <div className="space-y-6">
                    {/* Button Emoji */}
                    <div>
                      <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                        Participation Emoji
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setIsEmojiPickerOpen(!isEmojiPickerOpen)
                          }
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-bright transition-colors text-xl font-normal flex items-center gap-3 text-left min-h-[52px]"
                        >
                          {settings.reaction.startsWith("<") ? (
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Image
                                src={getEmojiUrl(settings.reaction)}
                                className="w-6 h-6 object-contain shrink-0"
                                alt="emoji"
                                width={24}
                                height={24}
                                unoptimized
                              />
                              <span className="text-gray-400 text-sm truncate">
                                {settings.reaction.match(/<a?:([^:]+):/)?.[1]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl">{settings.reaction}</span>
                          )}
                        </button>

                        {isEmojiPickerOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-50 bg-transparent"
                              onClick={() => setIsEmojiPickerOpen(false)}
                            />
                            <div className="absolute top-full left-0 w-80 h-96 bg-[#1e1f22] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden mt-2 animate-pop-in">
                              <div className="p-3 border-b border-white/5 bg-black/20">
                                <input
                                  type="text"
                                  placeholder="Search emojis..."
                                  className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none"
                                />
                              </div>
                              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                                  Server Emojis
                                </h4>
                                <div className="grid grid-cols-6 gap-2">
                                  {emojis.map((e) => (
                                    <button
                                      key={e.id}
                                      onClick={() => {
                                        setSettings({
                                          ...settings,
                                          reaction: `<${
                                            e.animated ? "a" : ""
                                          }:${e.name}:${e.id}>`,
                                        });
                                        setIsEmojiPickerOpen(false);
                                      }}
                                      className="aspect-square hover:bg-white/10 rounded-lg flex items-center justify-center transition-all bg-black/20"
                                    >
                                      <Image
                                        src={`https://cdn.discordapp.com/emojis/${
                                          e.id
                                        }.${e.animated ? "gif" : "png"}`}
                                        className="w-6 h-6 object-contain"
                                        alt={e.name}
                                        width={24}
                                        height={24}
                                        unoptimized
                                      />
                                    </button>
                                  ))}
                                </div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mt-4 mb-2">
                                  Standard
                                </h4>
                                <div className="grid grid-cols-6 gap-2">
                                  {standardEmojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => {
                                        setSettings({
                                          ...settings,
                                          reaction: emoji,
                                        });
                                        setIsEmojiPickerOpen(false);
                                      }}
                                      className="aspect-square hover:bg-white/10 rounded-lg flex items-center justify-center transition-all bg-black/20 text-xl"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Join Button Text */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-400 uppercase">
                          Join Button Text
                        </label>
                        <span
                          className={`text-xs font-mono ${
                            settings.joinButtonText.length > 35
                              ? "text-red-400"
                              : "text-gray-500"
                          }`}
                        >
                          {settings.joinButtonText.length}/40
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={40}
                        required
                        value={settings.joinButtonText}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            joinButtonText: e.target.value,
                          })
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600 font-medium"
                        placeholder="e.g. Join Giveaway"
                      />
                      {(!settings.joinButtonText ||
                        settings.joinButtonText.trim() === "") && (
                        <p className="text-red-400 text-xs mt-1">
                          This field is required
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                          Embed Color
                        </label>
                        <div className="flex items-center gap-3 bg-white/5  border border-white/10 rounded-xl p-2 pr-4 hover:border-blue-500/50 transition-colors">
                          <input
                            type="color"
                            value={settings.embedColor}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                embedColor: e.target.value,
                              })
                            }
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                          />
                          <span className="font-mono text-sm uppercase text-gray-300">
                            {settings.embedColor}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase mb-2">
                          End Color
                        </label>
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 pr-4 hover:border-red-500/50 transition-colors">
                          <input
                            type="color"
                            value={settings.endEmbedColor}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                endEmbedColor: e.target.value,
                              })
                            }
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                          />
                          <span className="font-mono text-sm uppercase text-gray-300">
                            {settings.endEmbedColor}
                          </span>
                        </div>
                      </div>
                    </div>
                    <label className="block text-sm font-bold text-gray-400 uppercase">
                      Winner Role
                    </label>
                    <RoleSelector
                      roles={roles}
                      selected={settings.winnerRole}
                      onChange={(roleId) =>
                        setSettings({ ...settings, winnerRole: roleId })
                      }
                      dropdownId="winner-role"
                      dropdownState={dropdownState}
                      placeholder="Choose a role..."
                    />
                  </div>
                </div>

                {/* Right Column: Roles & Notifications */}
                <div className="space-y-6">
                  {/* Manager Roles */}
                  <div className="bg-abyss/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md h-fit">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Shield size={22} className="text-green-400" /> Giveaway
                      Managers
                    </h3>
                    <div className="space-y-4">
                      <MultiSelector
                        items={roles}
                        selected={settings.managerRoles}
                        onToggle={(roleId) => {
                          if (settings.managerRoles.includes(roleId)) {
                            handleRemoveManagerRole(roleId);
                          } else {
                            handleAddManagerRole(roleId);
                          }
                        }}
                        dropdownId="manager-roles"
                        dropdownState={dropdownState}
                        placeholder="Select manager roles..."
                      />
                    </div>
                  </div>

                  {/* Notifications Card */}
                  <div className="bg-abyss/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md h-fit">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Zap size={22} className="text-yellow-400" /> Automation &
                      Alerts
                    </h3>
                    <div className="space-y-4">
                      <div
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.07] transition-colors"
                        onClick={() =>
                          setSettings({ ...settings, dmHost: !settings.dmHost })
                        }
                      >
                        <div>
                          <h4 className="font-bold">DM Host on End</h4>
                          <p className="text-sm text-gray-400">
                            Notify the host when their giveaway finishes.
                          </p>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            settings.dmHost ? "bg-green-500" : "bg-gray-700"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              settings.dmHost ? "left-7" : "left-1"
                            }`}
                          />
                        </div>
                      </div>

                      <div
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.07] transition-colors"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            dmWinners: !settings.dmWinners,
                          })
                        }
                      >
                        <div>
                          <h4 className="font-bold">DM Winners</h4>
                          <p className="text-sm text-gray-400">
                            Send a direct message to users who win.
                          </p>
                        </div>
                        <div
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            settings.dmWinners ? "bg-green-500" : "bg-gray-700"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                              settings.dmWinners ? "left-7" : "left-1"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <GiveawayModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveGiveaway}
          initialData={editingGiveaway}
          channels={channels}
          roles={roles}
          saving={saving}
          dropdownState={dropdownState}
          modalData={modalData}
          setModalData={setModalData}
          activeTab={activeModalTab}
          setActiveTab={setActiveModalTab}
        />
      )}
    </div>
  );
}

function GiveawayModal({
  onClose,
  onSave,
  initialData,
  channels,
  roles,
  saving,
  dropdownState,
  modalData,
  setModalData,
  activeTab,
  setActiveTab,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setModalData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in shadow-[0_0_100px_rgba(0,0,0,0.5)]">
      <div className="bg-abyss border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col font-outfit">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-abyss/50">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            {initialData ? (
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Settings className="text-primary" size={24} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Gift className="text-primary" size={24} />
              </div>
            )}
            {initialData ? "Edit Giveaway" : "New Giveaway"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-abyss/30">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${
              activeTab === "general"
                ? "border-primary text-white bg-primary/5"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            General Info
          </button>
          {!initialData && (
            <button
              onClick={() => setActiveTab("requirements")}
              className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 ${
                activeTab === "requirements"
                  ? "border-primary text-white bg-primary/5"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              Requirements
            </button>
          )}
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {activeTab === "general" ? (
            <>
              {/* Prize */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Gift size={14} className="text-primary" /> Giveaway Prize
                </label>
                <input
                  type="text"
                  name="prize"
                  value={modalData.prize}
                  onChange={handleChange}
                  placeholder="e.g. Discord Nitro, 1M Coins"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg font-bold focus:border-primary/50 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Winners */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Trophy size={14} className="text-primary" /> Winner Count
                  </label>
                  <input
                    type="number"
                    name="winners"
                    min="1"
                    max="50"
                    value={modalData.winners}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg font-bold focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Channel */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap size={14} className="text-primary" /> Target Channel
                  </label>
                  <ChannelSelector
                    channels={channels}
                    selected={modalData.channelId}
                    onChange={(id) =>
                      setModalData((prev) => ({ ...prev, channelId: id }))
                    }
                    dropdownId="modal-channel"
                    dropdownState={dropdownState}
                    placeholder="Select channel..."
                  />
                </div>
              </div>

              {/* Duration / End Time */}
              {modalData.type !== "drop" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />{" "}
                    {initialData ? "Total Time Left From Now" : "End Duration"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="duration"
                      value={modalData.duration}
                      onChange={handleChange}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg font-bold focus:border-primary/50 focus:outline-none transition-colors"
                    />
                    <GenericSelector
                      options={[
                        { id: "60000", name: "Minutes" },
                        { id: "3600000", name: "Hours" },
                        { id: "86400000", name: "Days" },
                      ]}
                      selected={modalData.unit}
                      onChange={(val) =>
                        setModalData((prev) => ({ ...prev, unit: val }))
                      }
                      dropdownId="modal-unit"
                      dropdownState={dropdownState}
                      className="w-36"
                      buttonClassName="w-full h-full bg-white/5 border border-white/10 rounded-xl px-4 flex items-center justify-between text-sm font-bold hover:bg-white/10 transition-all font-outfit"
                    />
                  </div>
                  {initialData && (
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      Enter the total time remaining until the giveaway ends
                      (e.g., if you want it to end in 5 mins, type 5).
                    </p>
                  )}
                </div>
              )}

              {!initialData && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Giveaway Type
                  </label>
                  <div className="grid grid-cols-2 gap-4 font-outfit">
                    <label
                      className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                        modalData.type === "normal"
                          ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="type"
                          value="normal"
                          checked={modalData.type === "normal"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <Gift
                          size={18}
                          className={
                            modalData.type === "normal"
                              ? "text-primary"
                              : "text-gray-500"
                          }
                        />
                        <span
                          className={`font-black uppercase tracking-widest text-xs ${
                            modalData.type === "normal"
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          Normal
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium leading-tight">
                        Standard giveaway that ends after a set duration.
                      </p>
                    </label>
                    <label
                      className={`flex flex-col gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
                        modalData.type === "drop"
                          ? "bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="type"
                          value="drop"
                          checked={modalData.type === "drop"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <Zap
                          size={18}
                          className={
                            modalData.type === "drop"
                              ? "text-amber-400"
                              : "text-gray-500"
                          }
                        />
                        <span
                          className={`font-black uppercase tracking-widest text-xs ${
                            modalData.type === "drop"
                              ? "text-white"
                              : "text-gray-400"
                          }`}
                        >
                          Drop
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium leading-tight">
                        First person to click effectively wins instantly. No
                        duration.
                      </p>
                    </label>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield size={14} className="text-primary" /> Required Role
                  </span>
                </label>
                <RoleSelector
                  roles={roles}
                  selected={modalData.req_role}
                  onChange={(id) =>
                    setModalData((prev) => ({ ...prev, req_role: id }))
                  }
                  dropdownId="modal-req-role"
                  dropdownState={dropdownState}
                  placeholder="No role required"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Minimum Level
                  </label>
                  <input
                    type="number"
                    name="req_level"
                    min="0"
                    value={modalData.req_level}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg font-bold focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Minimum Invites
                  </label>
                  <input
                    type="number"
                    name="req_invites"
                    min="0"
                    value={modalData.req_invites}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white text-lg font-bold focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/10 bg-abyss/50 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !modalData.prize || !modalData.channelId}
            className="px-10 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-xs bg-gradient-to-r from-primary to-blue-600 text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save size={18} />
            )}
            {initialData ? "Update Event" : "Launch Event 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
}
