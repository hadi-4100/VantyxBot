"use client";
import { useState, useEffect, use, useMemo, useCallback } from "react";
import { api } from "@/utils/api";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Shield,
  Clock,
  RotateCcw,
  UserX,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { useDropdownPortal } from "@/hooks/useDropdown";
import { GenericSelector } from "@/components/Dropdowns";
import Image from "next/image";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

export default function WarningsPage({ params }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const dropdownState = useDropdownPortal();
  const { markDirty, resetDirty, setSaveAction, setResetAction, isDirty } =
    useSave();

  // --- Reset Logic State (UI only) ---
  const [resetValue, setResetValue] = useState(0);
  const [resetUnit, setResetUnit] = useState("days");

  // Fetch Data State
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  // --- State Management ---
  // Settings
  const [settings, setSettings] = useState({
    enabled: true,
    resetAfterDays: 0,
  });
  const [originalSettings, setOriginalSettings] = useState(null);

  // Levels
  const [levels, setLevels] = useState([]);
  const [originalLevels, setOriginalLevels] = useState([]);

  // Users
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [pendingActions, setPendingActions] = useState([]); // { type: 'removeLast' | 'clearAll' | 'removeSpecific', userId, warningId? }

  // UI State
  const [activeModal, setActiveModal] = useState(null); // 'level' | 'userDetails'
  const [selectedLevel, setSelectedLevel] = useState(null); // For editing
  const [selectedUser, setSelectedUser] = useState(null); // For details
  const [userDetails, setUserDetails] = useState([]); // Warnings for selected user
  const [searchQuery, setSearchQuery] = useState("");

  // --- Constants ---
  const MAX_RESET_DAYS = 90;
  const MAX_LEVEL_DURATION_DAYS = 10;

  // --- Helper: Initialize Reset UI ---
  const initResetUI = useCallback((days) => {
    if (days === 0) {
      setResetValue(0);
      setResetUnit("days");
    } else if (days % 30 === 0 && days <= 90) {
      setResetValue(days / 30);
      setResetUnit("months");
    } else if (days >= 1) {
      setResetValue(days);
      setResetUnit("days");
    } else {
      setResetValue(Math.round(days * 24));
      setResetUnit("hours");
    }
  }, []);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    try {
      const [settingsData, levelsData, usersData] = await Promise.all([
        api.get(`/warnings/guild/${id}/settings`),
        api.get(`/warnings/guild/${id}/levels`),
        api.get(`/warnings/guild/${id}/users`),
      ]);

      const normalizedSettings = {
        enabled: !!settingsData?.enabled,
        resetAfterDays: Number(settingsData?.resetAfterDays) || 0,
      };

      setSettings(normalizedSettings);
      setOriginalSettings(JSON.parse(JSON.stringify(normalizedSettings)));
      initResetUI(normalizedSettings.resetAfterDays);

      const normLevels = Array.isArray(levelsData) ? levelsData : [];
      setLevels(normLevels);
      setOriginalLevels(JSON.parse(JSON.stringify(normLevels)));

      const normUsers = Array.isArray(usersData) ? usersData : [];
      setUsers(normUsers);
      setOriginalUsers(JSON.parse(JSON.stringify(normUsers)));
    } catch (err) {
      err.isApiError = true;
      setErrorVisible(err);
    } finally {
      setLoading(false);
    }
  }, [id, initResetUI]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Change Detection ---
  useEffect(() => {
    if (!originalSettings) return;

    const settingsChanged =
      settings.enabled !== originalSettings.enabled ||
      settings.resetAfterDays !== originalSettings.resetAfterDays;

    const levelsChanged =
      JSON.stringify(levels) !== JSON.stringify(originalLevels);

    const usersChanged = pendingActions.length > 0;

    if (settingsChanged || levelsChanged || usersChanged) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [
    settings,
    originalSettings,
    levels,
    originalLevels,
    pendingActions,
    markDirty,
    resetDirty,
  ]);

  // --- Handlers: Settings ---
  const handleResetChange = (val, unit) => {
    const multipliers = { hours: 1 / 24, days: 1, months: 30 };
    let days = val * multipliers[unit];

    // Clamp to max limits
    if (days > MAX_RESET_DAYS) {
      days = MAX_RESET_DAYS;
      // Update the input value to reflect the max
      if (unit === "hours") val = MAX_RESET_DAYS * 24;
      else if (unit === "days") val = MAX_RESET_DAYS;
      else if (unit === "months") val = MAX_RESET_DAYS / 30;
    }

    setResetValue(val);
    setResetUnit(unit);
    setSettings((prev) => ({ ...prev, resetAfterDays: Math.round(days) }));
  };

  // --- Handlers: Levels ---
  const handleSaveLevel = (levelData) => {
    // Check if threshold already exists (unless editing same level and threshold unchanged)
    const exists = levels.find((l) => l.threshold === levelData.threshold);
    if (
      exists &&
      (!selectedLevel || selectedLevel.threshold !== levelData.threshold)
    ) {
      toast.error("A warning level with this threshold already exists");
      return;
    }

    let newLevels;
    if (selectedLevel) {
      // Edit: Remove old level (by old threshold) and add new one
      // This handles both content update and threshold change
      newLevels = levels.filter((l) => l.threshold !== selectedLevel.threshold);
      newLevels.push(levelData);
    } else {
      // Add
      newLevels = [...levels, levelData];
    }

    // Sort by threshold
    newLevels.sort((a, b) => a.threshold - b.threshold);

    setLevels(newLevels);
    setActiveModal(null);
    setSelectedLevel(null);
  };

  const handleDeleteLevel = (threshold) => {
    setLevels((prev) => prev.filter((l) => l.threshold !== threshold));
    toast.info("Level marked for deletion - Save to apply");
  };

  // --- Handlers: Users ---
  const fetchUserDetails = async (userId) => {
    try {
      const data = await api.get(
        `/warnings/guild/${id}/users/${userId}/details`,
      );
      // Filter out warnings that are pending deletion
      const pendingDeletions = pendingActions
        .filter((a) => a.type === "removeSpecific" && a.userId === userId)
        .map((a) => a.warningId);

      setUserDetails(data.filter((w) => !pendingDeletions.includes(w._id)));

      // Find user object
      const user = users.find((u) => u.userId === userId);
      setSelectedUser(user);
      setActiveModal("userDetails");
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast.error("Failed to load user details");
    }
  };

  const handleRemoveLastWarning = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === userId ? { ...u, count: Math.max(0, u.count - 1) } : u,
      ),
    );
    setPendingActions((prev) => [...prev, { type: "removeLast", userId }]);
    toast.info("Warning marked for removal - Save to apply");
  };

  const handleClearAllWarnings = (userId) => {
    setUsers((prev) => prev.filter((u) => u.userId !== userId));
    setPendingActions((prev) => [...prev, { type: "clearAll", userId }]);
    toast.info("All warnings marked for removal - Save to apply");
    if (activeModal === "userDetails") setActiveModal(null);
  };

  const handleRemoveSpecificWarning = (userId, warningId) => {
    // Update details view
    setUserDetails((prev) => prev.filter((w) => w._id !== warningId));

    // Update main list count
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === userId ? { ...u, count: Math.max(0, u.count - 1) } : u,
      ),
    );

    setPendingActions((prev) => [
      ...prev,
      { type: "removeSpecific", userId, warningId },
    ]);
    toast.info("Warning marked for deletion - Save to apply");
  };

  // --- Master Save ---
  const handleSave = useCallback(async () => {
    // 1. Save Settings
    await api.post(`/warnings/guild/${id}/settings`, settings);

    // 2. Sync Levels
    const deletedLevels = originalLevels.filter(
      (ol) => !levels.find((l) => l.threshold === ol.threshold),
    );
    for (const level of deletedLevels) {
      await api.delete(`/warnings/guild/${id}/levels/${level.threshold}`);
    }
    // Upsert current levels
    for (const level of levels) {
      await api.post(`/warnings/guild/${id}/levels`, level);
    }

    // 3. Process Pending User Actions
    if (pendingActions.length > 0) {
      await api.post(`/warnings/guild/${id}/batch-update`, {
        actions: pendingActions,
      });
    }

    // 4. Update local state to match saved data
    setOriginalSettings(JSON.parse(JSON.stringify(settings)));
    setOriginalLevels(JSON.parse(JSON.stringify(levels)));
    setOriginalUsers(JSON.parse(JSON.stringify(users)));
    setPendingActions([]);
  }, [settings, levels, users, pendingActions, originalLevels, id]);

  // --- Master Cancel ---
  const handleReset = useCallback(() => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      initResetUI(originalSettings.resetAfterDays || 0);
    }
    setLevels(JSON.parse(JSON.stringify(originalLevels)));
    setUsers(JSON.parse(JSON.stringify(originalUsers)));
    setPendingActions([]);
  }, [originalSettings, originalLevels, originalUsers, initResetUI]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  // --- Render Helpers ---
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading Warnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss text-white font-sans selection:bg-primary/30">
      <Navbar />
      <Sidebar guildId={id} />

      <main className="md:pl-72 pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Warnings System
            </h1>
            <p className="text-gray-400 mt-2">
              Configure automated punishments and manage user warnings.
            </p>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center gap-4 bg-white/5 p-2 pr-6 rounded-full border border-white/10 backdrop-blur-sm">
            <button
              onClick={() =>
                setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings.enabled
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20"
                  : "bg-gray-700"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                  settings.enabled ? "translate-x-6" : "translate-x-0"
                }`}
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

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Reset Warnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <Clock size={24} />
                <h2 className="text-lg font-bold text-white">Reset Warnings</h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm text-gray-400">
                  Reset warnings after inactivity
                  <span className="block text-xs text-gray-500 mt-1">
                    Max: 3 months (0 = never)
                  </span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max={
                      resetUnit === "hours"
                        ? 2160
                        : resetUnit === "days"
                        ? 90
                        : 3
                    }
                    value={resetValue}
                    onChange={(e) =>
                      handleResetChange(
                        parseInt(e.target.value) || 0,
                        resetUnit,
                      )
                    }
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2 focus:border-primary/50 focus:outline-none transition-colors text-center font-mono"
                  />
                  <GenericSelector
                    options={[
                      { id: "hours", name: "Hours" },
                      { id: "days", name: "Days" },
                      { id: "months", name: "Months" },
                    ]}
                    selected={resetUnit}
                    onChange={(unit) => handleResetChange(resetValue, unit)}
                    dropdownId="reset-unit"
                    dropdownState={dropdownState}
                  />
                </div>
              </div>
            </div>

            {/* Warning Levels Summary */}
            <div className="bg-gradient-to-br from-primary/10 to-blue-600/10 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2 text-primary">
                <Shield size={24} />
                <h2 className="text-lg font-bold">Active Levels</h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                You have configured{" "}
                <span className="text-white font-bold">{levels.length}</span>{" "}
                warning levels.
              </p>
              <button
                onClick={() => {
                  setSelectedLevel(null);
                  setActiveModal("level");
                }}
                className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add New Level
              </button>
            </div>
          </div>

          {/* Right Column: Warning Levels List */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm min-h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <AlertTriangle className="text-orange-400" size={24} />
                  Warning Levels
                </h2>
              </div>

              <div className="space-y-3">
                {levels.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                    <Shield size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">
                      No warning levels configured
                    </p>
                    <button
                      onClick={() => {
                        setSelectedLevel(null);
                        setActiveModal("level");
                      }}
                      className="mt-4 text-primary hover:underline"
                    >
                      Create your first level
                    </button>
                  </div>
                ) : (
                  levels.map((level, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Restored Old Badge Design: Simple Circle */}
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-white">
                          {level.threshold}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {level.threshold} Warning
                              {level.threshold > 1 ? "s" : ""}
                            </span>
                            <span className="text-gray-600">→</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                level.action === "ban"
                                  ? "bg-red-500/20 text-red-400"
                                  : level.action === "kick"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : level.action === "timeout"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : level.action === "mute"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {level.action}
                            </span>
                          </div>
                          {(level.action === "timeout" ||
                            level.action === "mute") &&
                            level.duration > 0 && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock size={12} />
                                Duration: {formatDuration(level.duration)}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedLevel(level);
                            setActiveModal("level");
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteLevel(level.threshold)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Warned Users Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <UserX className="text-purple-400" size={24} />
              Warned Users
            </h2>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 w-full md:w-64 focus:border-purple-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm">
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Warnings</th>
                  <th className="p-4 font-medium">Last Incident</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.filter((u) =>
                  u.user.username
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
                ).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users
                    .filter((u) =>
                      u.user.username
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                    )
                    .map((u) => (
                      <tr
                        key={u.userId}
                        className="group hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                              {u.user.avatar ? (
                                <Image
                                  src={`https://cdn.discordapp.com/avatars/${u.userId}/${u.user.avatar}.png`}
                                  alt={u.user.username}
                                  className="w-full h-full object-cover"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                  {u.user.username[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">
                                {u.user.username}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {u.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            {u.count} Warning{u.count !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {new Date(u.lastWarning).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => fetchUserDetails(u.userId)}
                              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleRemoveLastWarning(u.userId)}
                              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                              title="Remove Last Warning (Pending Save)"
                            >
                              <RotateCcw size={18} />
                            </button>
                            <button
                              onClick={() => handleClearAllWarnings(u.userId)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                              title="Clear All Warnings (Pending Save)"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Level Modal */}
      {activeModal === "level" && (
        <LevelModal
          onClose={() => setActiveModal(null)}
          onSave={handleSaveLevel}
          initialData={selectedLevel}
          maxDuration={MAX_LEVEL_DURATION_DAYS}
          dropdownState={dropdownState}
        />
      )}

      {/* User Details Modal */}
      {activeModal === "userDetails" && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          warnings={userDetails}
          onClose={() => setActiveModal(null)}
          onDeleteWarning={handleRemoveSpecificWarning}
          onClearAll={handleClearAllWarnings}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function LevelModal({
  onClose,
  onSave,
  initialData,
  maxDuration,
  dropdownState,
}) {
  const [data, setData] = useState(
    initialData || {
      threshold: 1,
      action: "mute",
      duration: 0,
    },
  );

  // Duration UI state - calculate initial values from initialData
  const initialDuration = useMemo(() => {
    if (initialData && initialData.duration) {
      if (initialData.duration % 86400000 === 0) {
        return { val: initialData.duration / 86400000, unit: "days" };
      } else if (initialData.duration % 3600000 === 0) {
        return { val: initialData.duration / 3600000, unit: "hours" };
      } else {
        return {
          val: Math.round(initialData.duration / 60000),
          unit: "minutes",
        };
      }
    }
    return { val: 0, unit: "minutes" };
  }, [initialData]);

  const [durationVal, setDurationVal] = useState(initialDuration.val);
  const [durationUnit, setDurationUnit] = useState(initialDuration.unit);

  // Helper to handle duration changes and clamp to max
  const handleDurationChange = (val, unit) => {
    const multipliers = { minutes: 60000, hours: 3600000, days: 86400000 };
    let ms = val * multipliers[unit];
    const maxMs = maxDuration * 86400000;

    if (ms > maxMs) {
      ms = maxMs;
      // Recalculate val based on unit
      val = Math.floor(ms / multipliers[unit]);
    }

    setDurationVal(val);
    setDurationUnit(unit);
  };

  const handleSubmit = () => {
    const multipliers = { minutes: 60000, hours: 3600000, days: 86400000 };
    const durationMs =
      data.action === "mute" || data.action === "timeout"
        ? Math.max(durationVal, 1) * multipliers[durationUnit]
        : 0;

    onSave({ ...data, duration: durationMs });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-abyss border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl transform transition-all scale-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          {initialData ? (
            <Edit2 size={20} className="text-primary" />
          ) : (
            <Plus size={20} className="text-primary" />
          )}
          {initialData ? "Edit Warning Level" : "Add Warning Level"}
        </h2>

        <div className="space-y-4">
          {/* Threshold (Now Editable) */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Warning Count Threshold
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={data.threshold}
              onChange={(e) =>
                setData({ ...data, threshold: parseInt(e.target.value) || 1 })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Action</label>
            <div className="grid grid-cols-2 gap-2">
              {["kick", "ban", "mute", "timeout"].map((action) => (
                <button
                  key={action}
                  onClick={() => setData({ ...data, action })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                    data.action === action
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Duration (Conditional) */}
          {(data.action === "mute" || data.action === "timeout") && (
            <div className="animate-fade-in">
              <label className="block text-sm text-gray-400 mb-1">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  min="1"
                  value={durationVal || 1}
                  onChange={(e) =>
                    handleDurationChange(
                      Math.max(1, parseInt(e.target.value) || 1),
                      durationUnit,
                    )
                  }
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary/50 focus:outline-none transition-colors"
                />
                <GenericSelector
                  options={[
                    { id: "minutes", name: "Minutes" },
                    { id: "hours", name: "Hours" },
                    { id: "days", name: "Days" },
                  ]}
                  selected={durationUnit}
                  onChange={(unit) => handleDurationChange(durationVal, unit)}
                  dropdownId="duration-unit"
                  dropdownState={dropdownState}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Max duration: {maxDuration} days
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
          >
            {initialData ? "Update Level" : "Add Level"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailsModal({
  user,
  warnings,
  onClose,
  onDeleteWarning,
  onClearAll,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-abyss border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl transform transition-all scale-100 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
              {user.user.avatar ? (
                <Image
                  src={`https://cdn.discordapp.com/avatars/${user.userId}/${user.user.avatar}.png`}
                  alt={user.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                  {user.user.username[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.user.username}
              </h2>
              <p className="text-gray-400 text-sm">{user.userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {warnings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No warnings found for this user.
            </div>
          ) : (
            warnings.map((warning, idx) => (
              <div
                key={warning._id}
                className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(warning.timestamp).toLocaleString()}
                      </span>
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <User size={12} />
                        Mod: {warning.moderator?.username || "Unknown"}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      <span className="text-gray-500 font-medium">Reason:</span>{" "}
                      {warning.reason || "No reason provided"}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteWarning(user.userId, warning._id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete this warning (Pending Save)"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 flex justify-end gap-3">
          <button
            onClick={() => onClearAll(user.userId)}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Clear All Warnings
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
