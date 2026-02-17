"use client";
import { useEffect, useState, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { api } from "@/utils/api";
import {
  FileText,
  MessageSquare,
  Users,
  Shield,
  Hash,
  Mic,
  Server,
} from "lucide-react";
import { useDropdownPortal } from "@/hooks/useDropdown";
import { ChannelSelector } from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";

const logTypes = [
  {
    id: "member",
    icon: Users,
    label: "Member Logs",
    description:
      "Track member joins, leaves, nickname changes, and role updates",
    color: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
  },
  {
    id: "message",
    icon: MessageSquare,
    label: "Message Logs",
    description: "Monitor deleted and edited messages across your server",
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    id: "moderation",
    icon: Shield,
    label: "Moderation Logs",
    description:
      "Record all moderation actions including bans, kicks, and timeouts",
    color: "from-red-500 to-red-600",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
  {
    id: "server",
    icon: Server,
    label: "Server Logs",
    description:
      "Log server changes like channel, role, and emoji modifications",
    color: "from-green-500 to-green-600",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-400",
  },
  {
    id: "voice",
    icon: Mic,
    label: "Voice Logs",
    description:
      "Track voice channel activity including joins, leaves, and moves",
    color: "from-yellow-500 to-yellow-600",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
  },
];

export default function LogSettings({ params }) {
  const { id } = use(params);
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState([]);
  const [errorVisible, setErrorVisible] = useState(null);
  const dropdownState = useDropdownPortal();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  useEffect(() => {
    const fetchLogData = async () => {
      try {
        const [logsData, channelsData] = await Promise.all([
          api.get(`/logs/${id}`),
          api.get(`/guilds/${id}/channels`),
        ]);

        // Normalize Logs
        const logs = logsData?.logs || {};
        const normalizedLogs = {};
        logTypes.forEach((type) => {
          if (logs[type.id]) {
            if (typeof logs[type.id] === "string") {
              normalizedLogs[type.id] = {
                enabled: true,
                channel: logs[type.id],
              };
            } else {
              normalizedLogs[type.id] = {
                enabled: !!logs[type.id].enabled,
                channel: logs[type.id].channel || null,
              };
            }
          } else {
            normalizedLogs[type.id] = { enabled: false, channel: null };
          }
        });

        const finalSettings = { logs: normalizedLogs };
        setSettings(finalSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(finalSettings)));
        setChannels(Array.isArray(channelsData) ? channelsData : []);
      } catch (err) {
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogData();
  }, [id]);

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
    await api.post(`/logs/${id}`, { logs: settings });
    setOriginalSettings(JSON.parse(JSON.stringify(settings)));
  }, [settings, id]);

  const handleReset = useCallback(() => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
  }, [originalSettings]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  const toggleCategory = (id) => {
    setSettings((prev) => {
      const current = prev[id] || { enabled: false, channel: null };
      return {
        ...prev,
        [id]: {
          ...current,
          enabled: !current.enabled,
          channel: current.channel || null,
        },
      };
    });
  };

  const updateChannel = (id, channelId) => {
    setSettings((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        channel: channelId,
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading logging settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-32">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Logging System
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Configure event logging channels for your server
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {logTypes.map((type, i) => (
              <div
                key={type.id}
                className={`group relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
                  settings[type.id]?.enabled
                    ? "border-white/20 shadow-lg shadow-black/20"
                    : "border-white/10 hover:border-white/15"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {settings[type.id]?.enabled && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-5 rounded-2xl`}
                  ></div>
                )}

                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl ${type.iconBg} flex items-center justify-center`}
                      >
                        <type.icon size={24} className={type.iconColor} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {type.label}
                        </h3>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {type.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleCategory(type.id)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                        settings[type.id]?.enabled
                          ? `bg-gradient-to-r ${type.color}`
                          : "bg-gray-700"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-lg ${
                          settings[type.id]?.enabled ? "left-7" : "left-1"
                        }`}
                      ></div>
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-300 ${
                      settings[type.id]?.enabled ? "opacity-100" : "opacity-50"
                    }`}
                  >
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Hash size={12} />
                      Log Channel
                    </label>

                    <ChannelSelector
                      channels={channels}
                      selected={settings[type.id]?.channel}
                      onChange={(channelId) =>
                        updateChannel(type.id, channelId)
                      }
                      dropdownId={`log-channel-${type.id}`}
                      dropdownState={dropdownState}
                      placeholder="Select a channel..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
