"use client";
import { useEffect, useState, use, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

import { api } from "@/utils/api";
import {
  Shield,
  Link as LinkIcon,
  UserPlus,
  Settings,
  X,
  Save,
  Check,
  Hash,
  Users,
  Zap,
  Slash,
  AlertTriangle,
} from "lucide-react";
import { useDropdownPortal } from "@/hooks/useDropdown";
import { MultiSelector, GenericSelector } from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

export default function AutoModPage({ params }) {
  const { id } = use(params);
  const [settings, setSettings] = useState(null);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);
  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const dropdownState = useDropdownPortal();
  const [errorVisible, setErrorVisible] = useState(null);
  const {
    markDirty,
    resetDirty,
    setSaveAction,
    setResetAction,
    saving: globalSaving,
  } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  // Fetch settings
  useEffect(() => {
    const fetchAutoModData = async () => {
      try {
        const [automodData, channelsData, rolesData] = await Promise.all([
          api.get(`/automod/guild/${id}`),
          api.get(`/guilds/${id}/channels`),
          api.get(`/guilds/${id}/roles`),
        ]);

        const normalizedSettings = {
          antiSpam: {
            enabled: !!automodData?.antiSpam?.enabled,
            limit: automodData?.antiSpam?.limit || 5,
            action: automodData?.antiSpam?.action || "NONE",
          },
          antiBadWords: {
            enabled: !!automodData?.antiBadWords?.enabled,
            words: Array.isArray(automodData?.antiBadWords?.words)
              ? automodData.antiBadWords.words
              : [],
            action: automodData?.antiBadWords?.action || "NONE",
          },
          antiInvites: {
            enabled: !!automodData?.antiInvites?.enabled,
            action: automodData?.antiInvites?.action || "NONE",
          },
          antiLinks: {
            enabled: !!automodData?.antiLinks?.enabled,
            action: automodData?.antiLinks?.action || "NONE",
          },
        };

        setSettings(normalizedSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(normalizedSettings)));
        setChannels(channelsData || []);
        setRoles(
          (Array.isArray(rolesData) ? rolesData : []).filter(
            (r) => r.name !== "@everyone",
          ),
        );
      } catch (err) {
        err.isApiError = true;
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAutoModData();
  }, [id]);

  // Check for changes (deep comparison)
  useEffect(() => {
    if (!settings || !originalSettings) return;

    const hasChanges =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);

    if (hasChanges) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [settings, originalSettings, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    const togglesOnly = {
      antiSpam: { enabled: settings.antiSpam.enabled },
      antiBadWords: { enabled: settings.antiBadWords.enabled },
      antiInvites: { enabled: settings.antiInvites.enabled },
      antiLinks: { enabled: settings.antiLinks.enabled },
    };

    const data = await api.post(`/automod/guild/${id}`, togglesOnly);
    setSettings(data.automod);
    setOriginalSettings(JSON.parse(JSON.stringify(data.automod)));
  }, [settings, id]);

  const handleReset = useCallback(() => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
    }
  }, [originalSettings]);

  // Register actions
  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  const toggleModule = (module) => {
    setSettings((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        enabled: !prev[module].enabled,
      },
    }));
  };

  const refreshSettings = async () => {
    try {
      const data = await api.get(`/automod/guild/${id}`);
      setSettings(data);
      setOriginalSettings(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading auto-moderation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-32 md:pb-32 overflow-y-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-primary bg-clip-text text-transparent flex items-center gap-3">
              <Shield size={36} className="text-primary" />
              Auto-Moderation
            </h1>
            <p className="text-gray-400">
              Protect your server automatically with advanced filters and
              actions
            </p>
          </div>

          {/* Modules Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <AutoModCard
              title="Anti Spam"
              description="Prevent users from spamming messages (5 messages / 5 sec)"
              icon={Zap}
              color="yellow"
              enabled={settings.antiSpam.enabled}
              onToggle={() => toggleModule("antiSpam")}
              onSetup={() => setActiveModal("antiSpam")}
            />
            <AutoModCard
              title="Anti Bad Words"
              description="Block specific words and phrases from being sent"
              icon={Slash}
              color="red"
              enabled={settings.antiBadWords.enabled}
              onToggle={() => toggleModule("antiBadWords")}
              onSetup={() => setActiveModal("antiBadWords")}
            />
            <AutoModCard
              title="Anti Discord Invites"
              description="Block unauthorized Discord server invites"
              icon={UserPlus}
              color="purple"
              enabled={settings.antiInvites.enabled}
              onToggle={() => toggleModule("antiInvites")}
              onSetup={() => setActiveModal("antiInvites")}
            />
            <AutoModCard
              title="Anti Links"
              description="Block external links from being posted"
              icon={LinkIcon}
              color="blue"
              enabled={settings.antiLinks.enabled}
              onToggle={() => toggleModule("antiLinks")}
              onSetup={() => setActiveModal("antiLinks")}
            />
          </div>
        </main>
      </div>

      {/* Setup Modal */}
      {activeModal && (
        <SetupModal
          module={activeModal}
          settings={settings[activeModal]}
          channels={channels}
          roles={roles}
          guildId={id}
          dropdownState={dropdownState}
          onClose={() => {
            setActiveModal(null);
            refreshSettings();
          }}
        />
      )}
    </div>
  );
}

function AutoModCard({
  title,
  description,
  icon: Icon,
  color,
  enabled,
  onToggle,
  onSetup,
}) {
  const colorClasses = {
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  const theme = colorClasses[color];

  return (
    <div
      className={`card p-6 border-white/10 hover:border-white/20 transition-all duration-300 ${
        enabled ? "ring-1 ring-primary/20" : "opacity-80"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border ${theme}`}
        >
          <Icon size={24} />
        </div>

        {/* Toggle Switch */}
        <button
          onClick={onToggle}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
            enabled ? "bg-emerald-500" : "bg-gray-700"
          }`}
        >
          <div
            className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${
              enabled ? "left-8" : "left-1"
            }`}
          ></div>
        </button>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6 h-10">{description}</p>

      <button
        onClick={onSetup}
        disabled={!enabled}
        className={`w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          enabled
            ? "bg-white/5 hover:bg-white/10 text-white border border-white/10"
            : "bg-white/5 text-gray-500 cursor-not-allowed border border-transparent"
        }`}
      >
        <Settings size={16} />
        Setup Settings
      </button>
    </div>
  );
}

function SetupModal({
  module,
  settings,
  channels,
  roles,
  guildId,
  dropdownState,
  onClose,
}) {
  const [localSettings, setLocalSettings] = useState(
    JSON.parse(JSON.stringify(settings)),
  );
  const [newWord, setNewWord] = useState("");
  const [saving, setSaving] = useState(false);

  const handleActionChange = (action) => {
    setLocalSettings((prev) => {
      const actions = prev.actions || [];
      if (actions.includes(action)) {
        return { ...prev, actions: actions.filter((a) => a !== action) };
      } else {
        return { ...prev, actions: [...actions, action] };
      }
    });
  };

  const handleAddWord = (e) => {
    if (e.key === "Enter" && newWord.trim()) {
      e.preventDefault();
      if (!localSettings.words?.includes(newWord.trim())) {
        setLocalSettings((prev) => ({
          ...prev,
          words: [...(prev.words || []), newWord.trim()],
        }));
      }
      setNewWord("");
    }
  };

  const removeWord = (word) => {
    setLocalSettings((prev) => ({
      ...prev,
      words: prev.words.filter((w) => w !== word),
    }));
  };

  const toggleChannel = (channelId) => {
    setLocalSettings((prev) => {
      const excluded = prev.excludedChannels || [];
      if (excluded.includes(channelId)) {
        return {
          ...prev,
          excludedChannels: excluded.filter((id) => id !== channelId),
        };
      } else {
        return { ...prev, excludedChannels: [...excluded, channelId] };
      }
    });
  };

  const toggleRole = (roleId) => {
    setLocalSettings((prev) => {
      const excluded = prev.excludedRoles || [];
      if (excluded.includes(roleId)) {
        return {
          ...prev,
          excludedRoles: excluded.filter((id) => id !== roleId),
        };
      } else {
        return { ...prev, excludedRoles: [...excluded, roleId] };
      }
    });
  };

  const moduleTitles = {
    antiSpam: "Anti Spam Settings",
    antiBadWords: "Anti Bad Words Settings",
    antiInvites: "Anti Invites Settings",
    antiLinks: "Anti Links Settings",
  };

  // Calculate timeout display value
  const getTimeoutValue = () => {
    const duration = localSettings.timeoutDuration || 3600000;
    const unit = localSettings.timeoutUnit || "hours";
    const multiplier =
      unit === "minutes" ? 60000 : unit === "days" ? 86400000 : 3600000;
    return Math.round(duration / multiplier);
  };

  const setTimeoutValue = (value) => {
    const unit = localSettings.timeoutUnit || "hours";
    const multiplier =
      unit === "minutes" ? 60000 : unit === "days" ? 86400000 : 3600000;
    setLocalSettings((prev) => ({
      ...prev,
      timeoutDuration: value * multiplier,
    }));
  };

  const setTimeoutUnit = (unit) => {
    const currentValue = getTimeoutValue();
    const multiplier =
      unit === "minutes" ? 60000 : unit === "days" ? 86400000 : 3600000;
    setLocalSettings((prev) => ({
      ...prev,
      timeoutUnit: unit,
      timeoutDuration: currentValue * multiplier,
    }));
  };

  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(dropdownState.search.toLowerCase()),
  );

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(dropdownState.search.toLowerCase()),
  );

  const handleSave = async () => {
    setSaving(true);

    const promise = api
      .post(`/automod/guild/${guildId}`, { [module]: localSettings })
      .then(() => {
        return "Module settings saved successfully!";
      });

    toast.promise(promise, {
      loading: "Saving module settings...",
      success: (data) => {
        onClose();
        return data;
      },
      error: (err) => err.message,
      finally: () => setSaving(false),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-abyss border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-abyss z-10">
          <h2 className="text-2xl font-bold text-white">
            {moduleTitles[module]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Bad Words Input */}
          {module === "antiBadWords" && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Bad Words List
              </label>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-primary/50 transition-colors">
                <div className="flex flex-wrap gap-2 mb-2">
                  {localSettings.words?.map((word) => (
                    <span
                      key={word}
                      className="bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 border border-red-500/20"
                    >
                      {word}
                      <button
                        onClick={() => removeWord(word)}
                        className="hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={handleAddWord}
                  placeholder="Type a word and press Enter..."
                  className="bg-transparent w-full text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500">
                Press Enter to add a word to the filter list
              </p>
            </div>
          )}

          {/* Response Actions */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              Choose The Response
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  localSettings.actions?.includes("block")
                    ? "bg-primary/10 border-primary/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                    localSettings.actions?.includes("block")
                      ? "bg-primary border-primary"
                      : "border-gray-500"
                  }`}
                >
                  {localSettings.actions?.includes("block") && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={localSettings.actions?.includes("block") || false}
                  onChange={() => handleActionChange("block")}
                />
                <div>
                  <div className="font-semibold text-white">Block Message</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Delete messages that violate the filter
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  localSettings.actions?.includes("timeout")
                    ? "bg-primary/10 border-primary/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                    localSettings.actions?.includes("timeout")
                      ? "bg-primary border-primary"
                      : "border-gray-500"
                  }`}
                >
                  {localSettings.actions?.includes("timeout") && (
                    <Check size={14} className="text-white" />
                  )}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={localSettings.actions?.includes("timeout") || false}
                  onChange={() => handleActionChange("timeout")}
                />
                <div>
                  <div className="font-semibold text-white">Timeout Member</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Temporarily restrict the user from chatting
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Timeout Settings */}
          {localSettings.actions?.includes("timeout") && (
            <div className="space-y-3 animate-fade-in-up">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Timeout Duration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Duration</label>
                  <input
                    type="number"
                    min="1"
                    value={getTimeoutValue()}
                    onChange={(e) =>
                      setTimeoutValue(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Unit</label>
                  <GenericSelector
                    options={[
                      { id: "minutes", name: "Minutes" },
                      { id: "hours", name: "Hours" },
                      { id: "days", name: "Days" },
                    ]}
                    selected={localSettings.timeoutUnit || "hours"}
                    onChange={setTimeoutUnit}
                    dropdownId="timeout-unit"
                    dropdownState={dropdownState}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Minimum duration is 1 {localSettings.timeoutUnit || "hour"}
              </p>
            </div>
          )}

          {/* Exclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Hash size={16} /> Excluded Channels
              </label>
              <MultiSelector
                items={channels}
                selected={localSettings.excludedChannels || []}
                onToggle={toggleChannel}
                placeholder="Select channels..."
                type="channel"
                dropdownId="excluded-channels"
                dropdownState={dropdownState}
              />
              <p className="text-xs text-gray-500">
                Auto-mod will not apply to these channels
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} /> Excluded Roles
              </label>
              <MultiSelector
                items={roles}
                selected={localSettings.excludedRoles || []}
                onToggle={toggleRole}
                placeholder="Select roles..."
                type="role"
                dropdownId="excluded-roles"
                dropdownState={dropdownState}
              />
              <p className="text-xs text-gray-500">
                Members with these roles will be excluded
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="text-blue-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-blue-200">
              Members with{" "}
              <span className="font-semibold text-white">Administrator</span> or{" "}
              <span className="font-semibold text-white">Manage Server</span>{" "}
              permissions are always excluded from auto-moderation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-abyss sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-xl font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
