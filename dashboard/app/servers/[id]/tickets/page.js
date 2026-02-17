"use client";
import { useEffect, useState, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { api } from "@/utils/api";
import {
  Ticket,
  Settings,
  Plus,
  Trash2,
  MessageSquare,
  Layout,
  Clock,
} from "lucide-react";
import { useDropdownPortal } from "@/hooks/useDropdown";
import {
  GenericSelector,
  MultiSelector,
  ChannelSelector,
} from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

const DEFAULT_TICKET_SETTINGS = {
  enabled: false,
  installed: false,
  panelChannelId: null,
  ticketsCategoryId: null,
  panelEmbedId: null, // null = default
  ticketTypes: [],
  limits: { maxOpenTickets: 1 },
  autoRules: { closeAfterSeconds: null },
};

export default function TicketsPage({ params }) {
  const { id } = use(params);
  const [user, setUser] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const dropdownState = useDropdownPortal();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  const [settings, setSettings] = useState(DEFAULT_TICKET_SETTINGS);

  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [emojis, setEmojis] = useState([]);
  const [customEmbeds, setCustomEmbeds] = useState([]);

  // Modal State for Ticket Types
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [modalData, setModalData] = useState({
    name: "",
    emoji: "🎟",
    buttonLabel: "Open Ticket",
    buttonStyle: "PRIMARY",
    supportRoleIds: [],
    namingScheme: "ticket-{username}",
    welcomeMessage: "",
    enabled: true,
  });

  const fetchData = useCallback(async () => {
    try {
      const [
        ticketData,
        rolesData,
        channelsData,
        categoriesData,
        emojisData,
        embedsData,
        userData,
      ] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/guilds/${id}/roles`),
        api.get(`/guilds/${id}/channels`),
        api.get(`/guilds/${id}/categories`),
        api.get(`/guilds/${id}/emojis`),
        api.get(`/embeds/guild/${id}`),
        api.get(`/auth/user`),
      ]);

      setUser(userData);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setChannels(Array.isArray(channelsData) ? channelsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setEmojis(Array.isArray(emojisData) ? emojisData : []);
      setCustomEmbeds(Array.isArray(embedsData) ? embedsData : []);

      const mergedSettings = {
        ...DEFAULT_TICKET_SETTINGS,
        ...(ticketData || {}),
        limits: {
          ...DEFAULT_TICKET_SETTINGS.limits,
          ...(ticketData?.limits || {}),
        },
        autoRules: {
          ...DEFAULT_TICKET_SETTINGS.autoRules,
          ...(ticketData?.autoRules || {}),
        },
        ticketTypes: Array.isArray(ticketData?.ticketTypes)
          ? ticketData.ticketTypes
          : [],
      };
      setSettings(mergedSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(mergedSettings)));
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
    "🎟",
    "🎫",
    "📩",
    "🔧",
    "🆘",
    "🔥",
    "🛡️",
    "⚙️",
    "📫",
    "💎",
    "🎞️",
    "🛒",
    "⚖️",
  ];

  const handleSave = useCallback(async () => {
    await api.put(`/tickets/${id}`, settings);
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

  // Ticket Type Management
  const handleOpenModal = (type = null) => {
    if (type) {
      setEditingType(type);
      setModalData({ ...type });
    } else {
      setEditingType(null);
      setModalData({
        name: "Support",
        emoji: "🎟",
        buttonLabel: "Open Ticket",
        buttonStyle: "PRIMARY",
        supportRoleIds: [],
        namingScheme: "ticket-{username}",
        welcomeMessage: "Welcome {user}! describe your issue below.",
        enabled: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveType = () => {
    // Validation
    if (!modalData.name || !modalData.buttonLabel) {
      toast.error("Name and Button Label are required");
      return;
    }

    let newTypes = [...settings.ticketTypes];
    if (editingType) {
      const index = newTypes.findIndex((t) => t._id === editingType._id);
      if (index !== -1) {
        newTypes[index] = { ...newTypes[index], ...modalData };
      }
    } else {
      newTypes.push({
        ...modalData,
        _id: "temp_" + Math.random().toString(36).substr(2, 9),
      });
    }

    setSettings((prev) => ({ ...prev, ticketTypes: newTypes }));
    setIsModalOpen(false);
  };

  const handleDeleteType = (id) => {
    const newTypes = settings.ticketTypes.filter((t) => t._id !== id);
    setSettings((prev) => ({ ...prev, ticketTypes: newTypes }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading ticket system...</p>
        </div>
      </div>
    );
  }

  // Filter valid categories/text channels
  const textChannels = channels.filter((c) => c.type === 0);

  return (
    <div className="min-h-screen bg-void text-white flex flex-col font-outfit">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-32 overflow-y-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center animate-fade-in-up">
            <div>
              <h1 className="text-4xl font-black mb-2 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                <Ticket size={40} className="text-blue-400" />
                Ticket System
              </h1>
              <p className="text-gray-400 text-lg">
                Fully dashboard-driven ticket management.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {/* Main Configuration Config */}
            <div className="lg:col-span-2 space-y-8">
              {/* Enable Toggle */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-row items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">Enable System</h3>
                  <p className="text-sm text-gray-400">
                    Master switch for the ticket system.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newVal = !settings.enabled;
                    setSettings((prev) => ({ ...prev, enabled: newVal }));
                    // handleSaveSettings is manual or auto? We rely on Save Button for major changes, but toggle can be nice to auto-save.
                  }}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    settings.enabled ? "bg-emerald-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                      settings.enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Base Settings */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Settings className="text-purple-400" /> Base Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Panel Text Channel
                    </label>
                    <ChannelSelector
                      channels={textChannels}
                      selected={settings.panelChannelId}
                      onChange={(id) =>
                        setSettings({ ...settings, panelChannelId: id })
                      }
                      dropdownId="panel-channel"
                      dropdownState={dropdownState}
                      placeholder="Select Channel..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Ticket Category
                    </label>
                    <GenericSelector
                      options={categories}
                      selected={settings.ticketsCategoryId}
                      onChange={(id) =>
                        setSettings({ ...settings, ticketsCategoryId: id })
                      }
                      dropdownId="ticket-category"
                      dropdownState={dropdownState}
                      placeholder="Select Category..."
                      displayValue={(id) =>
                        categories.find((c) => c.id === id)?.name
                      }
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      Panel Embed Style
                    </label>
                    <GenericSelector
                      options={[
                        { id: null, name: "Default Embed" },
                        ...customEmbeds.map((e) => ({
                          id: e._id,
                          name: e.name,
                        })),
                      ]}
                      value={settings.panelEmbedId} /* fixed value issue */
                      selected={settings.panelEmbedId}
                      onChange={(id) =>
                        setSettings({ ...settings, panelEmbedId: id })
                      }
                      dropdownId="panel-embed"
                      dropdownState={dropdownState}
                      placeholder="Select Embed..."
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Types */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Layout className="text-blue-400" /> Ticket Types
                  </h3>
                  <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <Plus size={16} /> Add Type
                  </button>
                </div>

                <div className="space-y-4">
                  {settings.ticketTypes.map((type, idx) => (
                    <div
                      key={type._id || idx}
                      className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-${
                            type.buttonStyle === "DANGER"
                              ? "red"
                              : type.buttonStyle === "SUCCESS"
                              ? "emerald"
                              : type.buttonStyle === "SECONDARY"
                              ? "gray"
                              : "blue"
                          }-500/20`}
                        >
                          {type.emoji && type.emoji.startsWith("<") ? (
                            <Image
                              src={getEmojiUrl(type.emoji)}
                              className="w-6 h-6 object-contain"
                              alt="emoji"
                            />
                          ) : (
                            type.emoji
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{type.name}</h4>
                          <p className="text-xs text-gray-400 font-mono inline-block bg-white/5 px-2 py-0.5 rounded mt-1">
                            {type.buttonLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newTypes = [...settings.ticketTypes];
                            newTypes[idx].enabled = !newTypes[idx].enabled;
                            setSettings({ ...settings, ticketTypes: newTypes });
                          }}
                          className={`text-xs font-bold uppercase px-3 py-1 rounded-lg border transition-colors ${
                            type.enabled
                              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                              : "text-gray-500 border-gray-500/20 bg-gray-500/10"
                          }`}
                        >
                          {type.enabled ? "Active" : "Disabled"}
                        </button>
                        <button
                          onClick={() => handleOpenModal(type)}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {settings.ticketTypes.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                      No ticket types configured.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const confirmReset = window.confirm(
                      "Are you sure you want to reset all ticket types to default? This cannot be undone.",
                    );
                    if (confirmReset) {
                      const defaultTypes = [
                        {
                          name: "Support",
                          emoji: "🎟",
                          buttonLabel: "Open Ticket",
                          buttonStyle: "PRIMARY",
                          supportRoleIds: [],
                          namingScheme: "ticket-{username}",
                          welcomeMessage:
                            "Welcome {user}! describe your issue below.",
                          enabled: true,
                          _id:
                            "temp_" + Math.random().toString(36).substr(2, 9),
                        },
                      ];
                      setSettings((prev) => ({
                        ...prev,
                        ticketTypes: defaultTypes,
                      }));
                      toast.success(
                        "Ticket types reset locally. Don't forget to save!",
                      );
                    }
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Reset to Default
                </button>
              </div>
            </div>

            {/* Sidebar Config (Limits & Info) */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="text-amber-400" /> Limits & Rules
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                      Max Open Tickets (User)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="50"
                      value={settings.limits.maxOpenTickets}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          limits: {
                            ...settings.limits,
                            maxOpenTickets: parseInt(e.target.value) || 1,
                          },
                        })
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-colors font-mono"
                    />
                  </div>

                  {/* Auto Rule - Close After Seconds (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                      Auto-Close (Minutes)
                    </label>
                    <input
                      type="number"
                      min="60"
                      placeholder="Disabled, minimum 60 minutes"
                      value={
                        settings.autoRules.closeAfterSeconds
                          ? Math.floor(
                              settings.autoRules.closeAfterSeconds / 60,
                            )
                          : ""
                      }
                      onChange={(e) => {
                        const val = e.target.value
                          ? parseInt(e.target.value) * 60
                          : null;
                        setSettings({
                          ...settings,
                          autoRules: {
                            ...settings.autoRules,
                            closeAfterSeconds: val,
                          },
                        });
                      }}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500/50 transition-colors font-mono"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Leave empty to disable auto-closing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 rounded-3xl p-6">
                <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                  <MessageSquare size={18} /> Information
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  After configuring the settings, run{" "}
                  <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">
                    /ticket-setup
                  </code>{" "}
                  in your server to deploy the panel.
                  <br />
                  <br />
                  To reset, use{" "}
                  <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">
                    /ticket-reset
                  </code>
                  .
                  <br />
                  To update, use{" "}
                  <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">
                    /ticket-refresh
                  </code>
                  .
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Ticket Type Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#101010] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <h2 className="text-3xl font-black mb-6">
                {editingType ? "Edit Ticket Type" : "New Ticket Type"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Type Name
                  </label>
                  <input
                    type="text"
                    value={modalData.name}
                    onChange={(e) =>
                      setModalData({ ...modalData, name: e.target.value })
                    }
                    placeholder="e.g. Support"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={modalData.buttonLabel}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        buttonLabel: e.target.value,
                      })
                    }
                    placeholder="e.g. Open Ticket"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Emoji Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Emoji
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-xl font-normal flex items-center gap-3 text-left min-h-[52px]"
                    >
                      {modalData.emoji.startsWith("<") ? (
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Image
                            src={getEmojiUrl(modalData.emoji)}
                            className="w-6 h-6 object-contain shrink-0"
                            alt="emoji"
                          />
                          <span className="text-gray-400 text-sm truncate">
                            {modalData.emoji.match(/<a?:([^:]+):/)?.[1]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl">{modalData.emoji}</span>
                      )}
                    </button>

                    {isEmojiPickerOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-50 bg-transparent"
                          onClick={() => setIsEmojiPickerOpen(false)}
                        />
                        <div className="absolute top-full left-0 w-80 h-96 bg-[#1e1f22] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden mt-2">
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
                                    setModalData({
                                      ...modalData,
                                      emoji: `<${e.animated ? "a" : ""}:${
                                        e.name
                                      }:${e.id}>`,
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
                                    setModalData({ ...modalData, emoji });
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
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Button Style
                  </label>
                  <GenericSelector
                    options={[
                      {
                        id: "PRIMARY",
                        name: "Blue (Primary)",
                        color: 0x5865f2,
                      },
                      {
                        id: "SECONDARY",
                        name: "Gray (Secondary)",
                        color: 0x4f545c,
                      },
                      {
                        id: "SUCCESS",
                        name: "Green (Success)",
                        color: 0x22c55e,
                      },
                      { id: "DANGER", name: "Red (Danger)", color: 0xef4444 },
                    ]}
                    selected={modalData.buttonStyle}
                    onChange={(id) =>
                      setModalData({ ...modalData, buttonStyle: id })
                    }
                    dropdownId="btn-style"
                    dropdownState={dropdownState}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Support Roles (Access)
                  </label>
                  <MultiSelector
                    items={roles}
                    selected={modalData.supportRoleIds}
                    onToggle={(id) => {
                      if (modalData.supportRoleIds.includes(id)) {
                        setModalData({
                          ...modalData,
                          supportRoleIds: modalData.supportRoleIds.filter(
                            (r) => r !== id,
                          ),
                        });
                      } else {
                        setModalData({
                          ...modalData,
                          supportRoleIds: [...modalData.supportRoleIds, id],
                        });
                      }
                    }}
                    dropdownId="support-roles"
                    dropdownState={dropdownState}
                    placeholder="Select Roles..."
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">
                    Welcome Message
                  </label>
                  <textarea
                    value={modalData.welcomeMessage}
                    onChange={(e) =>
                      setModalData({
                        ...modalData,
                        welcomeMessage: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors min-h-[100px]"
                    placeholder="Message sent inside the ticket..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveType}
                  className="px-8 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
                >
                  Save Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
