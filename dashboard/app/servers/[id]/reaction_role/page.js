"use client";
import { useEffect, useState, useCallback, useMemo, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { api } from "@/utils/api";
import {
  Ticket,
  Plus,
  Trash2,
  Settings,
  Shield,
  Smile,
  Layout,
  Check,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useDropdownPortal } from "@/hooks/useDropdown";
import {
  ChannelSelector,
  RoleSelector,
  GenericSelector,
} from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

export default function ReactionRolePage({ params }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const [originalSettings, setOriginalSettings] = useState(null);
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [embeds, setEmbeds] = useState([]);
  const [reactionRoles, setReactionRoles] = useState({
    enabled: false,
    messages: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    channelId: "",
    embedId: null,
    interactionType: "buttons",
    allowMultiple: false,
    maxRoles: 2,
    roles: [],
  });
  const [editingMessage, setEditingMessage] = useState(null);
  const [openEmojiPickerIdx, setOpenEmojiPickerIdx] = useState(null);
  const [emojiSearch, setEmojiSearch] = useState("");

  const dropdownState = useDropdownPortal();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  const fetchData = useCallback(async () => {
    try {
      const [reactionData, channelsData, rolesData, emojisData, embedsData] =
        await Promise.all([
          api.get(`/reaction-roles/${id}`),
          api.get(`/guilds/${id}/channels`),
          api.get(`/guilds/${id}/roles`),
          api.get(`/guilds/${id}/emojis`),
          api.get(`/embeds/guild/${id}`),
        ]);

      const normalizedReactionRoles = {
        enabled: !!reactionData?.enabled,
        messages: Array.isArray(reactionData?.messages)
          ? reactionData.messages
          : [],
      };

      setReactionRoles(normalizedReactionRoles);
      setOriginalSettings(JSON.parse(JSON.stringify(normalizedReactionRoles)));
      setChannels(Array.isArray(channelsData) ? channelsData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setEmojis(Array.isArray(emojisData) ? emojisData : []);
      setEmbeds(Array.isArray(embedsData) ? embedsData : []);
    } catch (err) {
      err.isApiError = true;
      setErrorVisible(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    await api.post(`/reaction-roles/${id}`, reactionRoles);
    setOriginalSettings(JSON.parse(JSON.stringify(reactionRoles)));
  }, [reactionRoles, id]);

  const handleReset = useCallback(() => {
    if (originalSettings) {
      setReactionRoles(JSON.parse(JSON.stringify(originalSettings)));
    }
  }, [originalSettings]);

  // Register save and reset handlers with SaveContext
  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  // Track dirty state
  useEffect(() => {
    if (!originalSettings) return;

    if (JSON.stringify(reactionRoles) !== JSON.stringify(originalSettings)) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [reactionRoles, originalSettings, markDirty, resetDirty]);

  const handleOpenModal = (message = null) => {
    if (message) {
      setEditingMessage(message);
      setModalData({ ...message });
    } else {
      setEditingMessage(null);
      setModalData({
        channelId: channels[0]?.id || "",
        embedId: null,
        interactionType: "buttons",
        allowMultiple: false,
        maxRoles: 2,
        roles: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveMessage = () => {
    if (!modalData.channelId) {
      toast.error("Channel is required");
      return;
    }

    if (!modalData.roles || modalData.roles.length === 0) {
      toast.error("At least one role must be selected");
      return;
    }

    if (modalData.roles.some((r) => !r.roleId)) {
      toast.error("All roles must have a selected role from the list");
      return;
    }

    const roleIds = modalData.roles.map((r) => r.roleId);
    const hasDuplicates = roleIds.some(
      (id, index) => roleIds.indexOf(id) !== index,
    );
    if (hasDuplicates) {
      toast.error(
        "Duplicate roles detected. Each role must be unique per message.",
      );
      return;
    }

    let newMessages = [...reactionRoles.messages];
    if (editingMessage) {
      const index = newMessages.findIndex(
        (m) => String(m._id) === String(editingMessage._id),
      );
      if (index !== -1) {
        const existing = newMessages[index];
        newMessages[index] = {
          ...existing,
          ...modalData,
          messageId: modalData.messageId || existing.messageId,
          _id: existing._id,
        };
      }
    } else {
      if (newMessages.length >= 3) {
        toast.error("Maximum 3 messages allowed");
        return;
      }
      newMessages.push({ ...modalData, _id: "temp_" + Date.now() });
    }

    setReactionRoles((prev) => ({
      ...prev,
      messages: newTypesToApi(newMessages),
    }));
    setIsModalOpen(false);
  };

  // Helper to remove temp prefixes for API
  const newTypesToApi = (msgs) => {
    return msgs.map((m) => {
      const isTemp =
        String(m._id).startsWith("temp_") || String(m._id).includes("temp_");

      // Deep clean roles
      const cleanedRoles = (m.roles || []).map((role) => {
        const isRoleTemp =
          String(role._id).startsWith("temp_") ||
          String(role._id).includes("temp_");

        if (isRoleTemp) {
          const { _id, ...roleRest } = role;
          return roleRest;
        }
        return role;
      });

      if (isTemp) {
        const { _id, ...messageRest } = m;
        return { ...messageRest, roles: cleanedRoles };
      }

      return { ...m, roles: cleanedRoles };
    });
  };

  const handleDeleteMessage = (id) => {
    const newMessages = reactionRoles.messages.filter((m) => m._id !== id);
    setReactionRoles((prev) => ({ ...prev, messages: newMessages }));
  };

  const addRoleToModal = () => {
    if (modalData.roles.length >= 25) {
      toast.error("Max 25 roles per message");
      return;
    }
    setModalData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          _id: "temp_" + Math.random().toString(36).substr(2, 9),
          roleId: "",
          label: "New Role",
          emoji: null,
          description: "",
        },
      ],
    }));
  };

  const removeRoleFromModal = (idx) => {
    setModalData((prev) => {
      const newRoles = [...prev.roles];
      newRoles.splice(idx, 1);
      return { ...prev, roles: newRoles };
    });
  };

  const updateRoleInModal = (idx, field, value) => {
    setModalData((prev) => {
      const newRoles = [...prev.roles];
      newRoles[idx] = { ...newRoles[idx], [field]: value };
      return { ...prev, roles: newRoles };
    });
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

  const embedOptions = useMemo(() => {
    return [
      { id: null, name: "Default Embed" },
      ...embeds.map((e) => ({ id: e._id, name: e.name })),
    ];
  }, [embeds]);

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch) return emojis;
    return emojis.filter((e) =>
      e.name.toLowerCase().includes(emojiSearch.toLowerCase()),
    );
  }, [emojis, emojiSearch]);

  const standardEmojis = [
    "🎟",
    "🎫",
    "📩",
    "🔧",
    "🆘",
    "🔥",
    "🛡️",
    "⚙️",
    "📫",
    "外",
    "💎",
    "🎞️",
    "🛒",
    "⚖️",
    "✨",
    "✅",
    "❌",
    "👋",
    "🤖",
    "👑",
    "⭐",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading reaction roles...</p>
        </div>
      </div>
    );
  }

  const textChannels = channels.filter((c) => c.type === 0);

  return (
    <div className="min-h-screen bg-void text-white flex flex-col font-outfit">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-32 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center animate-fade-in-up">
            <div>
              <h1 className="text-4xl font-black mb-2 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                <Ticket size={40} className="text-blue-400" />
                Reaction Roles
              </h1>
              <p className="text-gray-400 text-lg">
                Declarative role assignment via interactive messages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {/* Main Configuration Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Enable Toggle Card */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-row items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">Enable System</h3>
                  <p className="text-sm text-gray-400">
                    Master switch for checking interactions.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setReactionRoles((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }))
                  }
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    reactionRoles.enabled ? "bg-emerald-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      reactionRoles.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Messages Container */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Layout className="text-blue-400" size={24} /> Messages
                    Setup
                  </h3>
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={16} /> Add Message
                  </button>
                </div>

                <div className="space-y-4">
                  {reactionRoles.messages.map((msg, idx) => (
                    <div
                      key={msg._id}
                      className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-white flex items-center gap-2">
                            Message #{idx + 1}
                            {msg.messageId ? (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-1">
                                <Check size={10} /> Deployed
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded uppercase font-mono flex items-center gap-1">
                                <Clock size={10} /> Pending Deployment
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            {channels.find((c) => c.id === msg.channelId)
                              ?.name || "unknown"}{" "}
                            • {msg.roles.length} Roles • {msg.interactionType}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(msg)}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {reactionRoles.messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                      No reaction messages configured.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const confirmReset = window.confirm(
                      "Are you sure you want to delete all messages? Don't forget to save after.",
                    );
                    if (confirmReset) {
                      setReactionRoles((prev) => ({ ...prev, messages: [] }));
                      toast.success(
                        "Cleared all messages locally. Don't forget to save!",
                      );
                    }
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Clear All Messages
                </button>
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="text-amber-400" size={18} /> Quick Commands
                </h3>
                <div className="space-y-4 font-mono text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-gray-500 mb-1">DEPLOY NEW CHANGES</p>
                    <span className="text-blue-400">/reaction-role-deploy</span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-gray-500 mb-1">REFRESH EXISTING</p>
                    <span className="text-indigo-400">
                      /reaction-role-refresh
                    </span>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-gray-500 mb-1">CLEANUP EVERYTHING</p>
                    <span className="text-red-400">/reaction-role-reset</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 rounded-3xl p-6">
                <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <MessageSquare size={18} /> Information
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  1. Max 3 messages per server.
                  <br />
                  2. Max 25 roles per message.
                  <br />
                  3. Select &quot;Default Embed&quot; for a simple setup without
                  manually creating one.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Configuration Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#101010] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-pop-in custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-3xl font-black mb-6">
                {editingMessage ? "Edit Message" : "New Message"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Target Channel
                  </label>
                  <ChannelSelector
                    channels={textChannels}
                    selected={modalData.channelId}
                    onChange={(val) =>
                      setModalData((prev) => ({ ...prev, channelId: val }))
                    }
                    dropdownId="modal-channel"
                    dropdownState={dropdownState}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Embed Design
                  </label>
                  <GenericSelector
                    options={embedOptions}
                    selected={modalData.embedId}
                    onChange={(val) =>
                      setModalData((prev) => ({ ...prev, embedId: val }))
                    }
                    dropdownId="modal-embed"
                    dropdownState={dropdownState}
                    placeholder="Select Embed..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Interaction Type
                  </label>
                  <GenericSelector
                    options={[
                      { id: "buttons", name: "Buttons" },
                      { id: "select", name: "Dropdown Menu" },
                    ]}
                    selected={modalData.interactionType}
                    onChange={(val) =>
                      setModalData((prev) => ({
                        ...prev,
                        interactionType: val,
                      }))
                    }
                    dropdownId="interaction-type"
                    dropdownState={dropdownState}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase flex justify-between">
                    Limit Selection
                    <span
                      className={`text-[10px] px-1.5 rounded ${
                        modalData.allowMultiple
                          ? "bg-indigo-500/20 text-indigo-400"
                          : "bg-white/5 text-gray-500"
                      }`}
                    >
                      {modalData.allowMultiple ? "Multi" : "Single"}
                    </span>
                  </label>
                  <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden p-1">
                    <button
                      onClick={() =>
                        setModalData((prev) => ({
                          ...prev,
                          allowMultiple: false,
                        }))
                      }
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        !modalData.allowMultiple
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      Single
                    </button>
                    <button
                      onClick={() =>
                        setModalData((prev) => ({
                          ...prev,
                          allowMultiple: true,
                        }))
                      }
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        modalData.allowMultiple
                          ? "bg-indigo-600 text-white shadow-lg"
                          : "text-gray-500 hover:text-white"
                      }`}
                    >
                      Multi
                    </button>
                  </div>
                </div>

                {modalData.allowMultiple && (
                  <div className="md:col-span-2 space-y-2 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-indigo-400 uppercase">
                        Max Selectable Roles
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={modalData.maxRoles}
                        onChange={(e) =>
                          setModalData((prev) => ({
                            ...prev,
                            maxRoles: parseInt(e.target.value) || 2,
                          }))
                        }
                        className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Shield size={20} className="text-blue-400" /> Roles Setup
                  </h3>
                  <button
                    onClick={addRoleToModal}
                    className="px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Add Role
                  </button>
                </div>

                <div className="space-y-4">
                  {modalData.roles.map((role, rIdx) => (
                    <div
                      key={role._id}
                      className="bg-white/5 border border-white/5 rounded-2xl p-6 relative group"
                    >
                      <button
                        onClick={() => removeRoleFromModal(rIdx)}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Pick Role
                          </label>
                          <RoleSelector
                            roles={roles}
                            selected={role.roleId}
                            onChange={(val) => {
                              const r = roles.find((rl) => rl.id === val);
                              updateRoleInModal(rIdx, "roleId", val);
                              if (r) updateRoleInModal(rIdx, "label", r.name);
                            }}
                            dropdownId={`role-sel-${rIdx}`}
                            dropdownState={dropdownState}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Button Label
                          </label>
                          <input
                            value={role.label}
                            onChange={(e) =>
                              updateRoleInModal(rIdx, "label", e.target.value)
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                            placeholder="e.g. Member"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Emoji
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenEmojiPickerIdx(
                                  openEmojiPickerIdx === rIdx ? null : rIdx,
                                )
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left flex items-center gap-2 hover:bg-white/10 transition-colors"
                            >
                              {role.emoji ? (
                                role.emoji.startsWith("<") ? (
                                  <Image
                                    src={getEmojiUrl(role.emoji)}
                                    className="w-5 h-5 object-contain"
                                    width={24}
                                    height={24}
                                    alt="emoji"
                                    unoptimized
                                  />
                                ) : (
                                  <span>{role.emoji}</span>
                                )
                              ) : (
                                <Smile size={16} className="text-gray-500" />
                              )}
                              <span className="text-sm text-gray-400">
                                {role.emoji
                                  ? role.emoji.match(/:([^:]+):/)?.[1] ||
                                    role.emoji
                                  : "Select Emoji"}
                              </span>
                            </button>

                            {openEmojiPickerIdx === rIdx && (
                              <>
                                <div
                                  className="fixed inset-0 z-50 bg-transparent"
                                  onClick={() => setOpenEmojiPickerIdx(null)}
                                />
                                <div className="absolute top-full left-0 w-80 h-96 bg-[#1e1f22] border border-white/10 rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden mt-2 animate-pop-in">
                                  <div className="p-3 border-b border-white/5 bg-black/20">
                                    <input
                                      type="text"
                                      placeholder="Search emojis..."
                                      value={emojiSearch}
                                      onChange={(e) =>
                                        setEmojiSearch(e.target.value)
                                      }
                                      className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none"
                                    />
                                  </div>
                                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <button
                                      onClick={() => {
                                        updateRoleInModal(rIdx, "emoji", null);
                                        setOpenEmojiPickerIdx(null);
                                      }}
                                      className="w-full mb-3 py-2 text-[10px] font-bold text-gray-500 bg-white/5 rounded-lg hover:bg-white/10 uppercase"
                                    >
                                      None
                                    </button>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                                      Server Emojis
                                    </h4>
                                    <div className="grid grid-cols-6 gap-2">
                                      {filteredEmojis.map((e) => (
                                        <button
                                          key={e.id}
                                          onClick={() => {
                                            updateRoleInModal(
                                              rIdx,
                                              "emoji",
                                              `<${e.animated ? "a" : ""}:${
                                                e.name
                                              }:${e.id}>`,
                                            );
                                            setOpenEmojiPickerIdx(null);
                                          }}
                                          className="aspect-square hover:bg-white/10 rounded-lg flex items-center justify-center transition-all bg-black/20"
                                        >
                                          <Image
                                            src={`https://cdn.discordapp.com/emojis/${
                                              e.id
                                            }.${e.animated ? "gif" : "png"}`}
                                            className="w-6 h-6 object-contain"
                                            width={24}
                                            height={24}
                                            alt="emoji"
                                            unoptimized
                                          />
                                        </button>
                                      ))}
                                    </div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mt-4 mb-2">
                                      Standard
                                    </h4>
                                    <div className="grid grid-cols-6 gap-2 pb-4">
                                      {standardEmojis.map((e) => (
                                        <button
                                          key={e}
                                          onClick={() => {
                                            updateRoleInModal(rIdx, "emoji", e);
                                            setOpenEmojiPickerIdx(null);
                                          }}
                                          className="aspect-square hover:bg-white/10 rounded-lg flex items-center justify-center transition-all bg-black/20 text-xl"
                                        >
                                          {e}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">
                            Small Description
                          </label>
                          <input
                            value={role.description || ""}
                            disabled={modalData.interactionType === "buttons"}
                            onChange={(e) =>
                              updateRoleInModal(
                                rIdx,
                                "description",
                                e.target.value,
                              )
                            }
                            className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none transition-colors text-sm ${
                              modalData.interactionType === "buttons"
                                ? "opacity-30 cursor-not-allowed border-white/5"
                                : "focus:border-blue-500"
                            }`}
                            placeholder={
                              modalData.interactionType === "buttons"
                                ? "Not available for buttons"
                                : "Viewable in Dropdown mode"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {modalData.roles.length === 0 && (
                    <div className="text-center py-10 bg-black/20 border border-white/5 rounded-3xl border-dashed">
                      <p className="text-gray-500">
                        Add at least one role to this message.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMessage}
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
                >
                  Save Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
