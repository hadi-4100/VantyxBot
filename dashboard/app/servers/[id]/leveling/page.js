"use client";
import { useEffect, useState, useCallback, useMemo, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

import { api } from "@/utils/api";
import {
  TrendingUp,
  Award,
  Plus,
  Trash2,
  X,
  Check,
  AlertCircle,
  Hash,
  Shield,
  MessageSquare,
  Info,
  Edit2,
  Mail,
} from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import {
  MultiSelector,
  ChannelSelector,
  RoleSelector,
} from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

export default function LevelingPage({ params }) {
  const { id } = use(params);
  const [settings, setSettings] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [originalData, setOriginalData] = useState(null);
  const [channels, setChannels] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  const dropdownState = useDropdown();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const fetchLevelingData = useCallback(async () => {
    try {
      const [settingsData, rewardsData, channelsData, rolesData] =
        await Promise.all([
          api.get(`/leveling/${id}/settings`),
          api.get(`/leveling/${id}/rewards`),
          api.get(`/guilds/${id}/channels`),
          api.get(`/guilds/${id}/roles`),
        ]);

      const sData = settingsData?.data || {};
      const rData = Array.isArray(rewardsData?.data) ? rewardsData.data : [];

      const normalizedSettings = {
        enabled: !!sData.enabled,
        noXpRoles: Array.isArray(sData.noXpRoles) ? sData.noXpRoles : [],
        noXpChannels: Array.isArray(sData.noXpChannels)
          ? sData.noXpChannels
          : [],
        levelUpMessage: {
          enabled: !!sData.levelUpMessage?.enabled,
          channel: sData.levelUpMessage?.channel || null,
          message: sData.levelUpMessage?.message || "",
        },
      };

      setSettings(normalizedSettings);
      setRewards(rData);
      setOriginalData(
        JSON.parse(
          JSON.stringify({ settings: normalizedSettings, rewards: rData }),
        ),
      );

      setChannels(Array.isArray(channelsData) ? channelsData : []);
      setRoles(
        (Array.isArray(rolesData) ? rolesData : []).filter(
          (r) => r.name !== "@everyone",
        ),
      );
    } catch (err) {
      setErrorVisible(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLevelingData();
  }, [fetchLevelingData]);

  // Dirty state detection
  useEffect(() => {
    if (!settings || !originalData) return;

    const currentData = JSON.stringify({ settings, rewards });
    const hasChanges = currentData !== JSON.stringify(originalData);

    if (hasChanges) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [settings, rewards, originalData, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    const json = await api.put(`/leveling/${id}/settings`, {
      ...settings,
      roleRewards: rewards,
    });

    setSettings(json.data);
    setRewards(json.data.roleRewards || []);
    setOriginalData(
      JSON.parse(
        JSON.stringify({
          settings: json.data,
          rewards: json.data.roleRewards || [],
        }),
      ),
    );
  }, [settings, rewards, id]);

  const handleReset = useCallback(() => {
    if (originalData) {
      setSettings(JSON.parse(JSON.stringify(originalData.settings)));
      setRewards(JSON.parse(JSON.stringify(originalData.rewards)));
    }
  }, [originalData]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  const handleToggleSystem = () => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleDeleteReward = (id) => {
    setRewards((prev) => prev.filter((r) => (r._id || r.id) !== id));
  };

  const handleSaveReward = (formData) => {
    // Check if level already exists (locally)
    const levelExists = rewards.find(
      (r) =>
        r.level === parseInt(formData.level) &&
        (!editingReward ||
          (r._id || r.id) !== (editingReward._id || editingReward.id)),
    );

    if (levelExists) {
      toast.error(`A reward for level ${formData.level} already exists!`);
      return;
    }

    if (editingReward) {
      setRewards((prev) =>
        prev.map((r) =>
          (r._id || r.id) === (editingReward._id || editingReward.id)
            ? { ...r, ...formData }
            : r,
        ),
      );
    } else {
      setRewards((prev) => [
        ...prev,
        { ...formData, _id: `temp-${Date.now()}` },
      ]);
    }
    setIsModalOpen(false);
    setEditingReward(null);
  };

  const messagePreview = useMemo(() => {
    if (!settings?.levelUpMessage?.message) return "";
    return settings.levelUpMessage.message
      .replace(/\[user\]/g, "@Member")
      .replace(/\[oldLevel\]/g, "9")
      .replace(/\[level\]/g, "10");
  }, [settings?.levelUpMessage?.message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading leveling system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-32 overflow-y-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-primary bg-clip-text text-transparent flex items-center gap-3">
                <TrendingUp size={36} className="text-primary" />
                Leveling System
              </h1>
              <p className="text-gray-400">
                Reward active members with XP, levels, and role rewards.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Toggle System */}
              <div className="flex items-center gap-3 bg-white/5 p-2 pr-6 rounded-full border border-white/10 backdrop-blur-sm">
                <button
                  onClick={handleToggleSystem}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center justify-center ${
                    settings.enabled
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20"
                      : "bg-gray-700"
                  }`}
                >
                  <div
                    className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300"
                    style={{
                      transform: settings.enabled
                        ? "translateX(24px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
                <span
                  className={`font-medium ${
                    settings.enabled ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {settings.enabled ? "System Enabled" : "System Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* NO XP Configuration */}
          <div
            className="mb-8 bg-abyss/50 border border-white/10 rounded-2xl p-6 animate-fade-in-up overflow-visible relative z-20"
            style={{ animationDelay: "0.1s" }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Shield size={24} className="text-primary" />
              NO XP Configuration
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible">
              {/* NO XP Roles */}
              <div>
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-amber-400" />
                  NO XP Roles
                </label>
                <MultiSelector
                  items={roles}
                  selected={settings.noXpRoles || []}
                  onToggle={(id) => {
                    const list = [...(settings.noXpRoles || [])];
                    const idx = list.indexOf(id);
                    if (idx > -1) list.splice(idx, 1);
                    else list.push(id);
                    setSettings({ ...settings, noXpRoles: list });
                  }}
                  placeholder="Select roles that cannot earn XP..."
                  type="role"
                  dropdownId="no-xp-roles"
                  dropdownState={dropdownState}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Members with these roles will not gain XP
                </p>
              </div>

              {/* NO XP Channels */}
              <div>
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Hash size={14} className="text-blue-400" />
                  NO XP Channels
                </label>
                <MultiSelector
                  items={channels.filter((c) => c.type === 0)}
                  selected={settings.noXpChannels || []}
                  onToggle={(id) => {
                    const list = [...(settings.noXpChannels || [])];
                    const idx = list.indexOf(id);
                    if (idx > -1) list.splice(idx, 1);
                    else list.push(id);
                    setSettings({ ...settings, noXpChannels: list });
                  }}
                  placeholder="Select channels where XP is disabled..."
                  type="channel"
                  dropdownId="no-xp-channels"
                  dropdownState={dropdownState}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Messages in these channels will not earn XP
                </p>
              </div>
            </div>
          </div>

          {/* Level Up Messages */}
          <div
            className="mb-8 bg-abyss/50 border border-white/10 rounded-2xl p-6 animate-fade-in-up relative z-10"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare size={24} className="text-primary" />
              Level Up Messages
            </h2>

            <div className="space-y-6">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <div className="font-semibold text-white mb-1">
                    Enable Level Up Messages
                  </div>
                  <div className="text-sm text-gray-400">
                    Send a message when users level up
                  </div>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      levelUpMessage: {
                        ...settings.levelUpMessage,
                        enabled: !settings.levelUpMessage?.enabled,
                      },
                    })
                  }
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    settings.levelUpMessage?.enabled
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "bg-gray-700"
                  }`}
                >
                  <div
                    className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300"
                    style={{
                      transform: settings.levelUpMessage?.enabled
                        ? "translateX(24px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Message Settings */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Level Up Channel (Optional)
                    </label>
                    <ChannelSelector
                      channels={channels.filter((c) => c.type === 0)}
                      selected={settings.levelUpMessage?.channel}
                      onChange={(channelId) =>
                        setSettings({
                          ...settings,
                          levelUpMessage: {
                            ...settings.levelUpMessage,
                            channel: channelId,
                          },
                        })
                      }
                      dropdownId="levelup-channel"
                      dropdownState={dropdownState}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                      Custom Message
                    </label>
                    <textarea
                      value={settings.levelUpMessage?.message || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          levelUpMessage: {
                            ...settings.levelUpMessage,
                            message: e.target.value,
                          },
                        })
                      }
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors resize-none font-mono text-sm"
                      placeholder="🥳 **Congratulations**, [user]!&#10;You climbed from level **[oldLevel]** to **[level]**. Keep it up!"
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["[user]", "[oldLevel]", "[level]"].map((v) => (
                        <code
                          key={v}
                          className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs font-mono"
                        >
                          {v}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    Live Preview
                  </label>
                  <div className="p-6 rounded-2xl bg-[#2b2d31] border border-white/5 shadow-2xl">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 border border-primary/30 flex items-center justify-center font-bold text-primary">
                        V
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            Vantyx
                          </span>
                          <span className="bg-primary text-white text-[10px] px-1 rounded font-bold">
                            BOT
                          </span>
                          <span className="text-gray-400 text-[10px]">
                            Today at 12:00 PM
                          </span>
                        </div>
                        <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed break-words">
                          {messagePreview || (
                            <span className="text-gray-600 italic">
                              Type a message to see preview...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2">
                    <Info size={16} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This preview shows how the message will appear in Discord
                      with variables replaced.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Rewards */}
          <div
            className="bg-abyss/50 border border-white/10 rounded-2xl p-6 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="flex flex-col mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Award size={24} className="text-primary" />
                  Role Rewards
                </h2>
                <button
                  onClick={() => {
                    setEditingReward(null);
                    setIsModalOpen(true);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Reward
                </button>
              </div>

              {/* Hierarchy & Permission Hint */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 animate-fade-in mb-4">
                <AlertCircle
                  size={20}
                  className="text-amber-400 shrink-0 mt-0.5"
                />
                <div className="text-sm">
                  <p className="text-amber-200 font-bold mb-1">
                    Hierarchy Important!
                  </p>
                  <p className="text-amber-400/80 leading-relaxed">
                    Ensure the <b>Vantyx</b> role is positioned <b>above</b> all
                    reward roles in your Discord server settings. The bot also
                    needs <b>Manage Roles</b> permission to grant these rewards
                    successfully.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={40} className="text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400">
                    No role rewards configured
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Create your first reward to motivate members!
                  </p>
                </div>
              ) : (
                rewards
                  .sort((a, b) => a.level - b.level)
                  .map((reward) => {
                    const role = roles.find((r) => r.id === reward.role);
                    return (
                      <div
                        key={reward._id}
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">
                                Level
                              </div>
                              <div className="text-3xl font-black">
                                {reward.level}
                              </div>
                            </div>
                            <div className="h-12 w-px bg-white/10" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: role?.color || "#99AAB5",
                                  }}
                                />
                                <span className="font-bold text-white truncate">
                                  {role?.name || "Unknown Role"}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                {reward.removeWithHigher && (
                                  <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                                    Progressive
                                  </span>
                                )}
                                {reward.dmMember && (
                                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 flex items-center gap-1">
                                    <Mail size={10} />
                                    DM
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingReward(reward);
                                setIsModalOpen(true);
                              }}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteReward(reward._id)}
                              className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Reward Modal */}
      {isModalOpen && (
        <RewardModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingReward(null);
          }}
          onSave={handleSaveReward}
          initialData={editingReward}
          roles={roles}
          rewards={rewards}
          dropdownState={dropdownState}
        />
      )}
    </div>
  );
}

function RewardModal({
  onClose,
  onSave,
  initialData,
  roles,
  rewards,
  dropdownState,
}) {
  const [formData, setFormData] = useState(
    initialData || {
      level: 1,
      role: "",
      removeWithHigher: false,
      dmMember: true,
    },
  );

  // Filter roles that are already used in other rewards
  const availableRoles = useMemo(() => {
    const usedRoleIds = rewards
      .filter((r) => !initialData || r._id !== initialData._id)
      .map((r) => r.role);

    return roles.filter((role) => !usedRoleIds.includes(role.id));
  }, [roles, rewards, initialData]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-abyss border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-abyss/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {initialData ? (
              <Edit2 className="text-primary" />
            ) : (
              <Plus className="text-primary" />
            )}
            {initialData ? "Edit Reward" : "Add New Reward"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Required Level
              </label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Role
              </label>
              <RoleSelector
                roles={availableRoles}
                selected={formData.role}
                onChange={(roleId) =>
                  setFormData({ ...formData, role: roleId })
                }
                dropdownId="reward-role"
                dropdownState={dropdownState}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 transition-all">
              <input
                type="checkbox"
                checked={formData.removeWithHigher}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    removeWithHigher: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary"
              />
              <div>
                <div className="text-sm font-medium">
                  Remove with Higher Reward
                </div>
                <div className="text-xs text-gray-400">
                  Remove this role when user gets a higher level reward
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 transition-all">
              <input
                type="checkbox"
                checked={formData.dmMember}
                onChange={(e) =>
                  setFormData({ ...formData, dmMember: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <Mail size={14} />
                <div>
                  <div className="text-sm font-medium">DM Member</div>
                  <div className="text-xs text-gray-400">
                    Send a private message when this reward is granted
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-abyss/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.role || !formData.level}
            className="px-8 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check size={18} />
            Keep Reward
          </button>
        </div>
      </div>
    </div>
  );
}
