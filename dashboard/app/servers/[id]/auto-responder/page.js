"use client";
import { useEffect, useState, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

import { api } from "@/utils/api";
import {
  MessageSquare,
  Plus,
  Trash2,
  Settings,
  X,
  Save,
  Hash,
  Users,
  Info,
  Zap,
  Reply,
  Send,
} from "lucide-react";
import { useDropdown } from "@/hooks/useDropdown";
import { MultiSelector } from "@/components/Dropdowns";
import { useSave } from "@/context/SaveContext";
import { toast } from "sonner";

export default function AutoResponderPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState({ enabled: false, responses: [] });
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState(null);
  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);

  const dropdownState = useDropdown();
  const { markDirty, resetDirty, setSaveAction, setResetAction } = useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const fetchResponderData = useCallback(async () => {
    try {
      const json = await api.get(`/auto-responder/guild/${id}`);
      const normalizedData = {
        enabled: !!json?.enabled,
        responses: Array.isArray(json?.responses) ? json.responses : [],
      };
      setData(normalizedData);
      setOriginalData(JSON.parse(JSON.stringify(normalizedData)));
    } catch (err) {
      err.isApiError = true;
      setErrorVisible(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGuildMetadata = useCallback(async () => {
    try {
      const [chanData, roleData] = await Promise.all([
        api.get(`/guilds/${id}/channels`),
        api.get(`/guilds/${id}/roles`),
      ]);

      setChannels(chanData);
      setRoles(
        (Array.isArray(roleData) ? roleData : []).filter(
          (r) => r.name !== "@everyone",
        ),
      );
    } catch (err) {
      console.error("Failed to fetch guild metadata:", err);
      err.isApiError = true;
      setErrorVisible(err);
    }
  }, [id]);

  useEffect(() => {
    fetchResponderData();
    fetchGuildMetadata();
  }, [fetchResponderData, fetchGuildMetadata]);

  // Dirty State Detection
  useEffect(() => {
    if (!data || !originalData) return;

    const hasChanges = JSON.stringify(data) !== JSON.stringify(originalData);

    if (hasChanges) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [data, originalData, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    const savedData = await api.post(`/auto-responder/guild/${id}`, data);

    const newData = {
      enabled:
        savedData.enabled !== undefined ? savedData.enabled : data.enabled,
      responses: savedData.responses || data.responses || [],
    };
    setData(newData);
    setOriginalData(JSON.parse(JSON.stringify(newData)));
  }, [data, id]);

  const handleReset = useCallback(() => {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
    }
  }, [originalData]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  const handleToggleFeature = () => {
    setData((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleDeleteResponse = (id) => {
    if (!id) return;
    setData((prev) => ({
      ...prev,
      responses: (prev.responses || []).filter((r) => (r._id || r.id) !== id),
    }));
  };

  const handleSaveResponse = (formData) => {
    // Check for duplicate triggers
    const isDuplicate = data.responses.some(
      (r) =>
        r.trigger.toLowerCase() === formData.trigger.toLowerCase() &&
        (!editingResponse ||
          (r._id || r.id) !== (editingResponse._id || editingResponse.id)),
    );

    if (isDuplicate) {
      toast.error("This trigger already exists!");
      return;
    }

    setData((prev) => {
      let newResponses;
      const currentResponses = prev.responses || [];
      if (editingResponse) {
        newResponses = currentResponses.map((r) =>
          (r._id || r.id) === (editingResponse._id || editingResponse.id)
            ? { ...r, ...formData }
            : r,
        );
      } else {
        newResponses = [
          ...currentResponses,
          {
            ...formData,
            id:
              Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          },
        ];
      }
      return { ...prev, responses: newResponses };
    });
    setIsModalOpen(false);
    setEditingResponse(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading auto-responder...</p>
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
                <MessageSquare size={36} className="text-primary" />
                Auto Responder
              </h1>
              <p className="text-gray-400">
                Create automatic messages that trigger when specific words are
                typed.
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Toggle Feature */}
              <div className="flex items-center gap-3 bg-white/5 p-2 pr-6 rounded-full border border-white/10 backdrop-blur-sm">
                <button
                  onClick={handleToggleFeature}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 flex items-center justify-center ${
                    data.enabled
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20"
                      : "bg-gray-700"
                  }`}
                >
                  <div
                    className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300"
                    style={{
                      transform: data.enabled
                        ? "translateX(24px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
                <span
                  className={`font-medium ${
                    data.enabled ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {data.enabled ? "System Enabled" : "System Disabled"}
                </span>
              </div>

              {/* Add Response Button */}
              <button
                onClick={() => {
                  setEditingResponse(null);
                  setIsModalOpen(true);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Response
              </button>
            </div>
          </div>

          {/* Variables Info */}
          <div
            className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-1">
              <Info size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Available Variables</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                You can use these variables in your responses:
                <code className="mx-1 px-1.5 py-0.5 bg-white/5 rounded text-primary">
                  [user]
                </code>{" "}
                (mentions the user),
                <code className="mx-1 px-1.5 py-0.5 bg-white/5 rounded text-primary">
                  [userName]
                </code>{" "}
                (displays user name without ping).
              </p>
            </div>
          </div>

          {/* Responses Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {!data?.responses || data.responses.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={40} className="text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-400">
                  No auto-responses found
                </h3>
                <p className="text-gray-500 mt-2">
                  Create your first trigger to get started!
                </p>
              </div>
            ) : (
              data.responses.map((resp, idx) => (
                <div
                  key={resp._id || resp.id}
                  className="card-hover group relative flex flex-col h-full overflow-hidden"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-bold font-mono truncate max-w-[150px]">
                          {resp.trigger}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold ${
                            resp.responseType === "reply"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {resp.responseType === "reply" ? "Reply" : "Normal"}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                      {resp.response}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {resp.enabledRoles?.length > 0 ||
                      resp.enabledChannels?.length > 0 ? (
                        <div className="flex -space-x-2">
                          {resp.enabledRoles?.length > 0 && (
                            <div
                              className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"
                              title={`${resp.enabledRoles.length} Roles`}
                            >
                              <Users size={14} />
                            </div>
                          )}
                          {resp.enabledChannels?.length > 0 && (
                            <div
                              className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400"
                              title={`${resp.enabledChannels.length} Channels`}
                            >
                              <Hash size={14} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                          Default Global
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingResponse(resp);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-primary/50 transition-all"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteResponse(resp._id || resp.id)
                        }
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ResponseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveResponse}
          initialData={editingResponse}
          channels={channels}
          roles={roles}
          dropdownState={dropdownState}
        />
      )}
    </div>
  );
}

function ResponseModal({
  onClose,
  onSave,
  initialData,
  channels,
  roles,
  dropdownState,
}) {
  const [formData, setFormData] = useState(
    initialData || {
      trigger: "",
      response: "",
      responseType: "normal",
      enabledRoles: [],
      disabledRoles: [],
      enabledChannels: [],
      disabledChannels: [],
    },
  );

  const [activeTab, setActiveTab] = useState("general"); // general, visibility

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleItem = (listName, id) => {
    setFormData((prev) => {
      const list = prev[listName] || [];
      if (list.includes(id)) {
        return { ...prev, [listName]: list.filter((item) => item !== id) };
      } else {
        return { ...prev, [listName]: [...list, id] };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in shadow-[0_0_100px_rgba(0,0,0,0.5)]">
      <div className="bg-abyss border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-abyss/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {initialData ? (
              <Settings className="text-primary" />
            ) : (
              <Plus className="text-primary" />
            )}
            {initialData ? "Edit Response" : "Add New Response"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-abyss/30">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === "general"
                ? "border-primary text-white bg-primary/5"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab("visibility")}
            className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === "visibility"
                ? "border-primary text-white bg-primary/5"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            Restrictions
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {activeTab === "general" ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap size={14} className="text-primary" /> Trigger Keyword
                </label>
                <input
                  type="text"
                  name="trigger"
                  value={formData.trigger}
                  onChange={handleChange}
                  placeholder="e.g. hello, !ping, help"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-500">
                  The word or phrase that will trigger this response.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare size={14} className="text-primary" /> Response
                  Message
                </label>
                <textarea
                  name="response"
                  value={formData.response}
                  onChange={handleChange}
                  rows={4}
                  placeholder="What should the bot say?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors resize-none"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Info size={12} /> Supporters [user], [userName]
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Response Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.responseType === "normal"
                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="responseType"
                      value="normal"
                      checked={formData.responseType === "normal"}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Send
                      size={18}
                      className={
                        formData.responseType === "normal"
                          ? "text-primary"
                          : "text-gray-500"
                      }
                    />
                    <span
                      className={`font-semibold ${
                        formData.responseType === "normal"
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      Normal
                    </span>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.responseType === "reply"
                        ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="responseType"
                      value="reply"
                      checked={formData.responseType === "reply"}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Reply
                      size={18}
                      className={
                        formData.responseType === "reply"
                          ? "text-primary"
                          : "text-gray-500"
                      }
                    />
                    <span
                      className={`font-semibold ${
                        formData.responseType === "reply"
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      Reply
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Hash size={14} /> Enabled Channels
                  </span>
                  <span>{formData.enabledChannels?.length || 0} Selected</span>
                </label>
                <MultiSelector
                  items={channels}
                  selected={formData.enabledChannels}
                  onToggle={(id) => toggleItem("enabledChannels", id)}
                  placeholder="Select enabled channels..."
                  type="channel"
                  dropdownId="enabled-channels"
                  dropdownState={dropdownState}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Hash size={14} /> Disabled Channels
                  </span>
                  <span>{formData.disabledChannels?.length || 0} Selected</span>
                </label>
                <MultiSelector
                  items={channels}
                  selected={formData.disabledChannels}
                  onToggle={(id) => toggleItem("disabledChannels", id)}
                  placeholder="Select disabled channels..."
                  type="channel"
                  dropdownId="disabled-channels"
                  dropdownState={dropdownState}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users size={14} /> Enabled Roles
                  </span>
                  <span>{formData.enabledRoles?.length || 0} Selected</span>
                </label>
                <MultiSelector
                  items={roles}
                  selected={formData.enabledRoles}
                  onToggle={(id) => toggleItem("enabledRoles", id)}
                  placeholder="Select enabled roles..."
                  type="role"
                  dropdownId="enabled-roles"
                  dropdownState={dropdownState}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users size={14} /> Disabled Roles
                  </span>
                  <span>{formData.disabledRoles?.length || 0} Selected</span>
                </label>
                <MultiSelector
                  items={roles}
                  selected={formData.disabledRoles}
                  onToggle={(id) => toggleItem("disabledRoles", id)}
                  placeholder="Select disabled roles..."
                  type="role"
                  dropdownId="disabled-roles"
                  dropdownState={dropdownState}
                />
              </div>
            </div>
          )}
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
            disabled={!formData.trigger || !formData.response}
            className="px-8 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={18} />
            Keep Response
          </button>
        </div>
      </div>
    </div>
  );
}
