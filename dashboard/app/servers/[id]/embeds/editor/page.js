"use client";
import { useEffect, useState, useMemo, useRef, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/api";
import {
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  User,
  Check,
  Settings,
  X,
  Code as CodeIcon,
  AlignEndVertical,
  AlignEndHorizontal,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useSave } from "@/context/SaveContext";

const isValidUrl = (string) => {
  if (!string) return true;

  try {
    if (!string.startsWith("https://")) return false;

    const url = new URL(string);

    if (url.protocol !== "https:") return false;

    return url.hostname.includes(".");
  } catch {
    return false;
  }
};

const PRESET_COLORS = [
  { name: "Red", hex: "#ff4646", dec: 16731718 },
  { name: "Orange", hex: "#ff8c00", dec: 16747520 },
  { name: "Yellow", hex: "#ffcc00", dec: 16763904 },
  { name: "Green", hex: "#2ecc71", dec: 3066993 },
  { name: "Blue", hex: "#7c51f4ff", dec: 2085745919 },
  { name: "Blurple", hex: "#5865f2", dec: 5809906 },
];

export default function EmbedEditorPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedId = searchParams.get("id");
  const { markDirty, resetDirty, setSaveAction, setResetAction, saving } =
    useSave();

  const [loading, setLoading] = useState(embedId ? true : false);
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [embedData, setEmbedData] = useState({
    title: "",
    description: "",
    url: "",
    color: 5809906,
    author: { name: "", url: "", icon_url: "" },
    thumbnail: { url: "" },
    image: { url: "" },
    footer: { text: "", icon_url: "" },
    fields: [],
  });

  const [initialData, setInitialData] = useState(null);

  const normalizeEmbedData = useCallback((data) => {
    return {
      title: data?.title || "",
      description: data?.description || "",
      url: data?.url || "",
      color: data?.color || 5809906,
      author: {
        name: data?.author?.name || "",
        url: data?.author?.url || "",
        icon_url: data?.author?.icon_url || "",
      },
      thumbnail: { url: data?.thumbnail?.url || "" },
      image: { url: data?.image?.url || "" },
      footer: {
        text: data?.footer?.text || "",
        icon_url: data?.footer?.icon_url || "",
      },
      fields: Array.isArray(data?.fields) ? data.fields : [],
    };
  }, []);

  useEffect(() => {
    if (embedId) {
      const fetchEmbed = async () => {
        try {
          const data = await api.get(`/embeds/guild/${id}`);
          const embed = data.find((e) => e._id === embedId);

          if (embed) {
            setName(embed.name || "");
            setCode(embed.code || "");
            const normalized = normalizeEmbedData(embed.embedData);
            setEmbedData(normalized);
            setInitialData({
              name: embed.name || "",
              code: embed.code || "",
              embedData: JSON.parse(JSON.stringify(normalized)),
            });
          } else {
            router.push(`/servers/${id}/embeds`);
          }
        } catch (err) {
          setErrorVisible(err);
        } finally {
          setLoading(false);
        }
      };
      fetchEmbed();
    } else {
      const defaultData = normalizeEmbedData({});
      const init = {
        name: "",
        code: "",
        embedData: defaultData,
      };
      setEmbedData(defaultData);
      setInitialData(init);
    }
  }, [id, embedId, router, normalizeEmbedData]);

  const handleFileUpload = async (path, file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const data = await api.upload(`/embeds/upload/${id}`, formData);
      if (data.url) updateEmbedData(path, data.url);
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Upload failed");
    }
  };

  const handleFileRemove = async (path) => {
    const keys = path.split(".");
    let url = embedData;
    for (const key of keys) url = url?.[key];
    url = String(url || "");

    updateEmbedData(path, "");

    if (url && url.includes("/uploads/embeds/")) {
      try {
        const filename = url.split("/").pop();
        await api.delete(`/embeds/upload/${id}/${filename}`);
      } catch (err) {
        console.error("Failed to delete remote file:", err);
      }
    }
  };

  // Detect changes and mark dirty
  useEffect(() => {
    if (!initialData) return;

    const hasChanges =
      name !== initialData.name ||
      code !== initialData.code ||
      JSON.stringify(embedData) !== JSON.stringify(initialData.embedData);

    if (hasChanges) {
      markDirty();
    } else {
      resetDirty();
    }
  }, [name, code, embedData, initialData, markDirty, resetDirty]);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !code.trim()) {
      throw new Error("Internal Name and Code are required.");
    }

    if (!isValidUrl(embedData.url)) throw new Error("Invalid Title URL");
    if (!isValidUrl(embedData.author.url))
      throw new Error("Invalid Author URL");

    const endpoint = embedId
      ? `/embeds/guild/${id}/${embedId}`
      : `/embeds/guild/${id}`;

    await (embedId
      ? api.patch(endpoint, { name, code, embedData })
      : api.post(endpoint, { name, code, embedData }));

    setInitialData({
      name,
      code,
      embedData: JSON.parse(JSON.stringify(embedData)),
    });
  }, [name, code, embedData, embedId, id]);

  const handleReset = useCallback(() => {
    if (!initialData) return;
    setName(initialData.name);
    setCode(initialData.code);
    setEmbedData(JSON.parse(JSON.stringify(initialData.embedData)));
  }, [initialData]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  const updateEmbedData = (path, value) => {
    const keys = path.split(".");
    setEmbedData((prev) => {
      const newData = { ...prev };
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addField = () => {
    if (embedData.fields.length >= 25) return;
    setEmbedData((prev) => ({
      ...prev,
      fields: [...prev.fields, { name: "", value: "", inline: false }],
    }));
  };

  const removeField = (index) => {
    setEmbedData((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const updateField = (index, key, value) => {
    setEmbedData((prev) => {
      const newFields = [...prev.fields];
      newFields[index] = { ...newFields[index], [key]: value };
      return { ...prev, fields: newFields };
    });
  };

  // Handle preset color selection
  const handlePresetColor = (dec) => {
    updateEmbedData("color", dec);
    setSelectedPreset(dec);
  };

  // Handle color picker selection
  const handlePickerColor = (hex) => {
    const dec = parseInt(hex.replace("#", ""), 16);
    updateEmbedData("color", dec);
    setSelectedPreset(null);
  };

  // Convert decimal to hex for Discord
  const decToHex = (dec) => {
    return "#" + (dec || 0).toString(16).padStart(6, "0");
  };

  useEffect(() => {
    const presetMatch = PRESET_COLORS.find((c) => c.dec === embedData.color);
    if (presetMatch) {
      setSelectedPreset(presetMatch.dec);
    } else {
      setSelectedPreset(null);
    }
  }, [embedData.color]);

  // Discord character limits validation
  const validation = useMemo(() => {
    const limits = {
      title: 256,
      description: 4096,
      footer: 2048,
      author: 256,
      fieldName: 256,
      fieldValue: 1024,
      fields: 25,
      total: 6000,
    };

    const current = {
      title: embedData.title?.length || 0,
      description: embedData.description?.length || 0,
      footer: embedData.footer?.text?.length || 0,
      author: embedData.author?.name?.length || 0,
      fields: embedData.fields.length,
      fieldContent: embedData.fields.reduce(
        (acc, f) => acc + (f.name?.length || 0) + (f.value?.length || 0),
        0,
      ),
    };

    current.total =
      current.title +
      current.description +
      current.footer +
      current.author +
      current.fieldContent;

    return { limits, current };
  }, [embedData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading embeds editor...</p>
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
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {embedId ? "Edit Embed" : "Create New Embed"}
                  </h1>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    {embedId
                      ? `Editing "${name}"`
                      : "Design your custom Discord embed"}
                  </p>
                </div>
              </div>
            </div>

            {/* Meta Config */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-2">
                <Settings size={18} className="text-primary" />
                <h3 className="font-bold">General Configuration</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Embed Name (Internal)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Welcome Message V2"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Embed Code (Unique)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">
                      /
                    </span>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) =>
                        setCode(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, ""),
                        )
                      }
                      placeholder="welcome_embed"
                      className="w-full bg-black/20 border border-white/10 rounded-xl pl-8 pr-4 py-3 focus:border-primary/50 outline-none font-mono transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Editor Container */}
            <div
              className="bg-[#2b2d31] rounded-lg p-6 border-l-4 mt-6 relative shadow-lg"
              style={{
                borderLeftColor: `#${embedData.color
                  .toString(16)
                  .padStart(6, "0")}`,
              }}
            >
              {/* Bot Avatar */}
              <div className="flex gap-4 mb-6 items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 border border-primary/30 flex items-center justify-center font-bold text-primary">
                  V
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Vantyx</span>
                    <span className="bg-primary text-white text-[10px] px-1 rounded font-bold">
                      BOT
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      Today at 12:00 PM
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/30 my-6"></div>

              {/* Embed Content */}
              <div className="flex flex-col-reverse md:flex-row gap-6">
                {/* Main Left Column */}
                <div className="flex-1 space-y-4">
                  {/* Color Row */}
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-gray-400 font-medium text-sm">
                      Color
                    </span>
                    <div className="flex gap-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => handlePresetColor(c.dec)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{ backgroundColor: c.hex }}
                        >
                          {selectedPreset === c.dec && (
                            <Check
                              size={14}
                              className="text-white drop-shadow-md"
                            />
                          )}
                        </button>
                      ))}

                      {/* Divider */}
                      <div className="w-px h-6 bg-white/30 hidden sm:block"></div>

                      {/* Custom Color Picker */}
                      <div className="relative w-6 h-6 rounded-full overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                        <Image
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/BYR_color_wheel.svg/1024px-BYR_color_wheel.svg.png"
                          className="w-full h-full object-cover"
                          alt="Custom"
                          width={64}
                          height={64}
                          unoptimized
                        />
                        <input
                          type="color"
                          value={decToHex(embedData.color)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handlePickerColor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Author Row */}
                  <div className="flex gap-4">
                    <ImageUploadSquare
                      className="w-14 h-14 shrink-0"
                      circle
                      dashed
                      placeholderIcon={<User size={20} />}
                      onFile={(file) =>
                        handleFileUpload("author.icon_url", file)
                      }
                      onRemove={() => handleFileRemove("author.icon_url")}
                      url={embedData.author.icon_url}
                    />
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                      <div className="flex-1 relative rounded-2xl">
                        <input
                          className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] transition-colors"
                          placeholder="Name"
                          value={embedData.author.name}
                          maxLength={256}
                          onChange={(e) =>
                            updateEmbedData("author.name", e.target.value)
                          }
                        />
                        <span className="absolute right-2 top-2.5 text-[10px] text-gray-600 pointer-events-none">
                          {embedData.author.name?.length || 0}/256
                        </span>
                      </div>
                      <div className="flex-1 relative">
                        <input
                          className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-blue-400 outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] transition-colors"
                          placeholder="URL"
                          value={embedData.author.url}
                          onChange={(e) =>
                            updateEmbedData("author.url", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-[#393943]"></div>

                  {/* Title Section */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-gray-200 font-medium outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] transition-colors"
                        placeholder="Title"
                        value={embedData.title}
                        maxLength={256}
                        onChange={(e) =>
                          updateEmbedData("title", e.target.value)
                        }
                      />
                      <span className="absolute right-2 top-2.5 text-[10px] text-gray-600 pointer-events-none">
                        {embedData.title?.length || 0}/256
                      </span>
                    </div>
                    <input
                      className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-blue-400 outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] transition-colors"
                      placeholder="Title URL (Optional)"
                      value={embedData.url}
                      onChange={(e) => updateEmbedData("url", e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="relative">
                    <textarea
                      className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] min-h-[120px] resize-y scrollbar-thin scrollbar-thumb-[#202225] scrollbar-track-transparent transition-colors"
                      placeholder="Create and manage embed messages"
                      value={embedData.description}
                      maxLength={4096}
                      onChange={(e) =>
                        updateEmbedData("description", e.target.value)
                      }
                    />
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-[#393943]"></div>

                  {/* Fields List */}
                  <div className="space-y-4">
                    {embedData.fields.map((field, idx) => (
                      <div key={idx} className="group">
                        <div className="flex flex-col sm:flex-row gap-3 mb-2">
                          {/* Field Name */}
                          <input
                            className="flex-1 bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] transition-colors font-medium"
                            placeholder="Title"
                            value={field.name}
                            maxLength={256}
                            onChange={(e) =>
                              updateField(idx, "name", e.target.value)
                            }
                          />

                          {/* Controls */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* Alignment Selector */}
                            <div className="bg-[#1e1f22] border border-[#383a40] rounded-[4px] h-[42px] flex items-center p-1 gap-1">
                              {/* Inline Button */}
                              <button
                                onClick={() => updateField(idx, "inline", true)}
                                className={`h-8 w-8 rounded-[4px] flex items-center justify-center transition-all ${
                                  field.inline
                                    ? "bg-[#5865f2] text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-200 hover:bg-[#2b2d31]"
                                }`}
                                title="Inline"
                              >
                                <AlignEndVertical size={16} />
                              </button>
                              {/* Not Inline (Block) Button */}
                              <button
                                onClick={() =>
                                  updateField(idx, "inline", false)
                                }
                                className={`h-8 w-8 rounded-[4px] flex items-center justify-center transition-all ${
                                  !field.inline
                                    ? "bg-[#5865f2] text-white shadow-sm"
                                    : "text-gray-400 hover:text-gray-200 hover:bg-[#2b2d31]"
                                }`}
                                title="Not Inline (Full Width)"
                              >
                                <AlignEndHorizontal size={16} />
                              </button>
                            </div>

                            {/* Delete */}
                            <button
                              onClick={() => removeField(idx)}
                              className="h-[42px] w-[42px] rounded-full bg-[#2b2d31] hover:bg-red-500 text-red-500 hover:text-white border border-[#383a40] hover:border-red-500 flex items-center justify-center transition-all shadow-sm"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Field Value */}
                        <textarea
                          className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-gray-300 outline-none placeholder:text-[#949ba4] focus:border-[#00a8fc] resize-none h-auto min-h-[100px]"
                          placeholder="Value"
                          value={field.value}
                          maxLength={1024}
                          onChange={(e) =>
                            updateField(idx, "value", e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Add Field Button */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={addField}
                      disabled={embedData.fields.length >= 25}
                      className="px-6 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white rounded-[4px] text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Field
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px bg-[#393943]"></div>

                  {/* Large Image Area */}
                  <ImageUploadSquare
                    onFile={(file) => handleFileUpload("image.url", file)}
                    onRemove={() => handleFileRemove("image.url")}
                    url={embedData.image.url}
                    dashed
                    placeholderIcon={<ImageIcon size={32} />}
                    className="w-full min-h-[160px]"
                    contain
                  />

                  {/* Divider */}
                  <div className="w-full h-px bg-[#393943]"></div>

                  {/* Footer Row */}
                  <div className="flex gap-4 items-center">
                    <ImageUploadSquare
                      className="w-14 h-14 shrink-0"
                      circle
                      dashed
                      placeholderIcon={<ImageIcon size={16} />}
                      onFile={(file) =>
                        handleFileUpload("footer.icon_url", file)
                      }
                      onRemove={() => handleFileRemove("footer.icon_url")}
                      url={embedData.footer.icon_url}
                    />
                    <div className="flex-1 relative">
                      <input
                        className="w-full bg-transparent border border-[#383a40] rounded-[4px] px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-[#00a8fc] placeholder:text-[#949ba4] transition-colors"
                        placeholder="Footer"
                        value={embedData.footer.text}
                        maxLength={2048}
                        onChange={(e) =>
                          updateEmbedData("footer.text", e.target.value)
                        }
                      />
                      <span className="absolute right-2 top-2.5 text-[10px] text-gray-600 pointer-events-none">
                        {embedData.footer.text?.length || 0}/2048
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column (Thumbnail) */}
                <div className="w-full md:w-24 shrink-0 pt-0 md:pt-10 flex justify-center md:block">
                  <div className="sticky top-4">
                    <ImageUploadSquare
                      onFile={(file) => handleFileUpload("thumbnail.url", file)}
                      onRemove={() => handleFileRemove("thumbnail.url")}
                      url={embedData.thumbnail.url}
                      dashed
                      placeholderIcon={<ImageIcon size={24} />}
                      className="w-24 h-24 md:w-20 md:h-20 rounded-[4px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ImageUploadSquare({
  url,
  onFile,
  onRemove,
  circle,
  dashed,
  placeholderIcon,
  className,
  contain,
}) {
  const [fitMode, setFitMode] = useState("cover");
  const fileInput = useRef();

  return (
    <div
      onClick={() => fileInput.current.click()}
      className={`relative cursor-pointer flex items-center justify-center transition-all overflow-visible shrink-0 group
    ${
      dashed
        ? "border-2 border-dashed border-[#383a40] bg-transparent hover:bg-[#383a40]/20"
        : "border border-white/10 bg-black/10 hover:bg-black/20"
    }
    ${circle ? "rounded-full" : "rounded-[4px]"}
    ${className}
  `}
    >
      {url ? (
        <>
          <Image
            src={url}
            unoptimized
            fill={!contain}
            width={contain ? 0 : undefined}
            height={contain ? 0 : undefined}
            sizes={contain ? "100vw" : undefined}
            alt=""
            onLoad={(e) => {
              if (contain) {
                return;
              }
              const img = e.target;
              const ratio = img.naturalWidth / img.naturalHeight;
              if (ratio > 1.8 || ratio < 0.6) {
                setFitMode("contain");
              } else {
                setFitMode("cover");
              }
            }}
            className={`transition-all ${
              !contain && fitMode === "cover"
                ? "object-cover"
                : "object-contain"
            } ${contain ? "w-full h-auto min-h-full" : ""} ${
              circle ? "rounded-full" : "rounded-[4px]"
            }`}
            style={
              contain
                ? {
                    width: "100%",
                    height: "auto",
                  }
                : {
                    width: "100%",
                    height: "100%",
                    maxWidth: "100%",
                    maxHeight: "100%",
                  }
            }
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove && onRemove();
            }}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
            title="Remove Image"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <div className="text-[#383a40] group-hover:text-[#4e5058] transition-colors">
          {placeholderIcon || <ImageIcon size={24} />}
        </div>
      )}

      <input
        type="file"
        ref={fileInput}
        hidden
        accept="image/*"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}
