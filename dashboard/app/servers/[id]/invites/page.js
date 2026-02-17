"use client";
import { useEffect, useState, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { api } from "@/utils/api";

import {
  Users,
  Award,
  Settings,
  Plus,
  Trash2,
  X,
  Check,
  Shield,
  PlusCircle,
  Edit2,
  UserX,
} from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import { RoleSelector, MemberSelector } from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";

export default function InvitesPage({ params }) {
  const { id } = use(params);
  const [settings, setSettings] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [roles, setRoles] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);
  const [activeTab, setActiveTab] = useState("settings");
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);

  const dropdownState = useDropdown();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const fetchData = useCallback(async () => {
    try {
      const [configData, rolesData, membersData] = await Promise.all([
        api.get(`/invites/${id}/config`),
        api.get(`/guilds/${id}/roles`),
        api.get(`/guilds/${id}/members`),
      ]);

      const normalizedSettings = {
        enabled: !!configData?.enabled,
        fakeThreshold: {
          enabled: !!configData?.fakeThreshold?.enabled,
          days: Number(configData?.fakeThreshold?.days) || 1,
        },
        blacklist: Array.isArray(configData?.blacklist)
          ? configData.blacklist
          : [],
        rewards: Array.isArray(configData?.rewards) ? configData.rewards : [],
      };

      setSettings(normalizedSettings);
      setOriginalData(JSON.parse(JSON.stringify(normalizedSettings)));
      setRoles(
        (Array.isArray(rolesData) ? rolesData : []).filter(
          (r) => r.name !== "@everyone",
        ),
      );
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (err) {
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
    if (!settings || !originalData) return;

    const currentData = JSON.stringify(settings);
    const hasChanges = currentData !== JSON.stringify(originalData);

    if (hasChanges) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [settings, originalData, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    const savedSettings = await api.post(`/invites/${id}/config`, settings);
    setSettings(savedSettings);
    setOriginalData(JSON.parse(JSON.stringify(savedSettings)));
  }, [settings, id]);

  const handleReset = useCallback(() => {
    if (originalData) {
      setSettings(JSON.parse(JSON.stringify(originalData)));
    }
  }, [originalData]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading invite system...</p>
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
                <Users size={36} className="text-primary" />
                Invite System
              </h1>
              <p className="text-gray-400">
                Manage rewards and configure invite link settings.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl w-fit border border-white/10">
            {[
              { id: "settings", label: "General Settings", icon: Settings },
              { id: "rewards", label: "Role Rewards", icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in-up" key={activeTab}>
            {activeTab === "settings" && (
              <div className="space-y-6">
                {/* Enable Toggle */}
                <div className="bg-abyss/50 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-1">
                        Enable Invite System
                      </h2>
                      <p className="text-gray-400 text-sm">
                        Start tracking who joins via which invite link.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          enabled: !prev.enabled,
                        }));
                      }}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                        settings.enabled ? "bg-green-500" : "bg-gray-700"
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
                  </div>
                </div>

                {/* Fake Threshold */}
                <div className="bg-abyss/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield size={22} className="text-primary" />
                    Fake Invite Prevention
                  </h2>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-4">
                    <div>
                      <div className="font-semibold">
                        Fake Account Threshold
                      </div>
                      <p className="text-xs text-gray-500">
                        Flag accounts younger than X days as fake.
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings({
                          ...settings,
                          fakeThreshold: {
                            ...settings.fakeThreshold,
                            enabled: !settings.fakeThreshold.enabled,
                          },
                        })
                      }
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                        settings.fakeThreshold?.enabled
                          ? "bg-primary"
                          : "bg-gray-700"
                      }`}
                    >
                      <div
                        className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300"
                        style={{
                          transform: settings.fakeThreshold?.enabled
                            ? "translateX(24px)"
                            : "translateX(0)",
                        }}
                      />
                    </button>
                  </div>
                  {settings.fakeThreshold?.enabled && (
                    <div className="flex items-center gap-4 animate-fade-in">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={settings.fakeThreshold.days}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fakeThreshold: {
                              ...settings.fakeThreshold,
                              days: parseInt(e.target.value) || 1,
                            },
                          })
                        }
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-24 text-center focus:border-primary outline-none"
                      />
                      <span className="text-gray-400">
                        Days since account creation
                      </span>
                    </div>
                  )}
                </div>

                {/* Blacklist */}
                <div className="bg-abyss/50 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <UserX size={22} className="text-red-500" />
                    Blacklisted Users
                  </h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Users in this list will not have their invites counted.
                  </p>
                  <MemberSelector
                    members={members}
                    selected={settings.blacklist}
                    onToggle={(memberId) => {
                      const newBlacklist = settings.blacklist.includes(memberId)
                        ? settings.blacklist.filter((id) => id !== memberId)
                        : [...settings.blacklist, memberId];
                      setSettings({
                        ...settings,
                        blacklist: newBlacklist,
                      });
                    }}
                    dropdownId="blacklist-members"
                    dropdownState={dropdownState}
                    placeholder="Select members to blacklist..."
                  />
                </div>
              </div>
            )}

            {activeTab === "rewards" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-abyss/50 border border-white/10 rounded-2xl p-6">
                  <div>
                    <h2 className="text-2xl font-bold">Role Rewards</h2>
                    <p className="text-gray-400 text-sm">
                      Grant roles automatically when users reach invite goals.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingReward(null);
                      setIsRewardModalOpen(true);
                    }}
                    className="bg-primary p-3 rounded-xl hover:shadow-lg transition-all active:scale-95"
                  >
                    <Plus size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.rewards.length === 0 ? (
                    <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                      <Award size={48} className="mx-auto text-gray-600 mb-2" />
                      <p className="text-gray-500 font-semibold">
                        No rewards configured yet.
                      </p>
                    </div>
                  ) : (
                    settings.rewards.map((reward) => {
                      const role = roles.find((r) => r.id === reward.role);
                      return (
                        <div
                          key={reward._id}
                          className="bg-abyss/50 border border-white/10 rounded-2xl p-5 hover:border-primary/50 transition-all flex justify-between items-center group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-[10px] text-primary font-bold uppercase">
                                Invites
                              </p>
                              <p className="text-2xl font-black">
                                {reward.inviteCount}
                              </p>
                            </div>
                            <div className="h-10 w-px bg-white/10" />
                            <div>
                              <p className="font-bold flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: role?.color || "#99AAB5",
                                  }}
                                />
                                {role?.name || "Unknown Role"}
                              </p>
                              <div className="flex gap-2">
                                {reward.removeWithHigher && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 rounded border border-amber-500/20">
                                    Progressive
                                  </span>
                                )}
                                {reward.dmMember && (
                                  <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 rounded border border-blue-500/20">
                                    DM notified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingReward(reward);
                                setIsRewardModalOpen(true);
                              }}
                              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                setSettings({
                                  ...settings,
                                  rewards: settings.rewards.filter(
                                    (r) => r._id !== reward._id,
                                  ),
                                })
                              }
                              className="p-2 hover:bg-white/5 rounded-lg text-red-500"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Reward Modal */}
      {isRewardModalOpen && (
        <RewardModal
          onClose={() => setIsRewardModalOpen(false)}
          onSave={(newReward) => {
            let newRewards = [...settings.rewards];
            if (editingReward) {
              newRewards = newRewards.map((r) =>
                r._id === editingReward._id ? newReward : r,
              );
            } else {
              newRewards.push(newReward);
            }

            setSettings({ ...settings, rewards: newRewards });
            setIsRewardModalOpen(false);
          }}
          initialData={editingReward}
          roles={roles}
          dropdownState={dropdownState}
        />
      )}
    </div>
  );
}

function RewardModal({ onClose, onSave, initialData, roles, dropdownState }) {
  const [formData, setFormData] = useState(
    initialData || {
      inviteCount: 1,
      role: roles[0]?.id || "",
      removeWithHigher: false,
      dmMember: false,
    },
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-fade-in">
      <div className="bg-void border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-pop-in">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            {initialData ? <Edit2 size={20} /> : <PlusCircle size={20} />}
            {initialData ? "Edit Reward" : "Add Reward"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
              Invite Threshold
            </label>
            <input
              type="number"
              min="1"
              value={formData.inviteCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  inviteCount: parseInt(e.target.value) || 1,
                })
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary"
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
              Reward Role
            </label>
            <RoleSelector
              roles={roles}
              selected={formData.role}
              onChange={(roleId) => setFormData({ ...formData, role: roleId })}
              dropdownId="reward-role"
              dropdownState={dropdownState}
            />
          </div>
          <div className="space-y-3 pt-2">
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
                className="w-4 h-4 rounded border-gray-600 bg-white/5 text-primary focus:ring-primary"
              />
              <div>
                <div className="text-sm font-medium">
                  Remove when higher reward achieved
                </div>
                <div className="text-xs text-gray-400">
                  Clean up lower level reward roles automatically.
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
                className="w-4 h-4 rounded border-gray-600 bg-white/5 text-primary focus:ring-primary"
              />
              <div>
                <div className="text-sm font-medium">Notify user via DM</div>
                <div className="text-xs text-gray-400">
                  Send a private message when they earn this reward.
                </div>
              </div>
            </label>
          </div>
        </div>
        <div className="p-6 bg-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (isNaN(formData.inviteCount) || formData.inviteCount < 1)
                return alert("Invalid count");
              if (!formData.role) return alert("Please select a role");

              onSave({
                ...formData,
                _id:
                  initialData?._id || Math.random().toString(36).substr(2, 9),
              });
            }}
            className="px-8 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Check size={18} />
            Keep Changes
          </button>
        </div>
      </div>
    </div>
  );
}
