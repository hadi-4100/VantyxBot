"use client";
import { useEffect, useState, useMemo, useCallback, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { api } from "@/utils/api";
import {
  Terminal,
  Shield,
  Info,
  Home,
  TrendingUp,
  Music,
  Settings,
  MessageSquare,
  Gift,
  PlusIcon,
  SmilePlus,
  Ticket,
  Search,
  Activity,
  Power,
  PowerOff,
  Filter,
  Command as CommandIcon,
} from "lucide-react";
import { useSave } from "@/context/SaveContext";

export default function CommandsManager({ params }) {
  const { id } = use(params);
  const [commands, setCommands] = useState([]);
  const [settings, setSettings] = useState({
    disabledCategories: [],
    disabledCommands: [],
  });
  const [originalSettings, setOriginalSettings] = useState({
    disabledCategories: [],
    disabledCommands: [],
  });
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { markDirty, resetDirty, setSaveAction, setResetAction, saving } =
    useSave();

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  // Category metadata mapping
  const categoryMetadata = {
    general: {
      icon: Home,
      description: "Basic commands for general server interaction",
      color: "blue",
    },
    moderation: {
      icon: Shield,
      description: "Powerful tools to keep your server safe",
      color: "red",
    },
    info: {
      icon: Info,
      description: "Get detailed information about users and server",
      color: "purple",
    },
    leveling: {
      icon: TrendingUp,
      description: "Manage experience points and levels",
      color: "green",
    },
    music: {
      icon: Music,
      description: "Control music playback and queue",
      color: "pink",
    },
    settings: {
      icon: Settings,
      description: "Configure bot settings for your server",
      color: "gray",
    },
    fun: {
      icon: MessageSquare,
      description: "Engagement and entertainment commands",
      color: "yellow",
    },
    giveaway: {
      icon: Gift,
      description: "Manage giveaways and prizes",
      color: "orange",
    },
    invites: {
      icon: PlusIcon,
      description: "Manage invites",
      color: "sky",
    },
    reaction_role: {
      icon: SmilePlus,
      description: "Manage reaction roles",
      color: "indigo",
    },
    tickets: {
      icon: Ticket,
      description: "Manage tickets",
      color: "emerald",
    },
  };

  const categories = useMemo(() => {
    const cats = ["All", ...new Set(commands.map((c) => c.category))];
    return cats;
  }, [commands]);

  useEffect(() => {
    const fetchCommandData = async () => {
      try {
        const [commandsData, guildSettings] = await Promise.all([
          api.get("/commands"),
          api.get(`/commands/guild/${id}`),
        ]);

        const allFlatCommands = Object.values(commandsData || {}).flat();
        const processedCommands = [];

        allFlatCommands.forEach((cmd) => {
          if (!cmd) return;
          const subcommands = cmd.options?.filter((o) =>
            [1, 2, "1", "2"].includes(o.type),
          );

          if (subcommands && subcommands.length > 0) {
            subcommands.forEach((sub) => {
              processedCommands.push({
                ...cmd,
                name: `${cmd.name} ${sub.name}`,
                parentName: cmd.name,
                description: sub.description,
                options: sub.options || [],
                isSubcommand: true,
              });
            });
          } else {
            processedCommands.push(cmd);
          }
        });

        const normalizedSettings = {
          disabledCategories: Array.isArray(guildSettings?.disabledCategories)
            ? guildSettings.disabledCategories
            : [],
          disabledCommands: Array.isArray(guildSettings?.disabledCommands)
            ? guildSettings.disabledCommands
            : [],
        };

        setCommands(processedCommands);
        setSettings(normalizedSettings);
        setOriginalSettings(JSON.parse(JSON.stringify(normalizedSettings)));
      } catch (err) {
        err.isApiError = true;
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommandData();
  }, [id]);

  useEffect(() => {
    if (!settings || !originalSettings) return;
    const changed =
      JSON.stringify([...(settings.disabledCategories || [])].sort()) !==
        JSON.stringify(
          [...(originalSettings.disabledCategories || [])].sort(),
        ) ||
      JSON.stringify([...(settings.disabledCommands || [])].sort()) !==
        JSON.stringify([...(originalSettings.disabledCommands || [])].sort());

    if (changed) markDirty();
    else resetDirty();
  }, [settings, originalSettings, markDirty, resetDirty]);

  const handleReset = useCallback(() => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
  }, [originalSettings]);

  const handleSave = useCallback(async () => {
    await api.post(`/commands/guild/${id}`, settings);
    setOriginalSettings(JSON.parse(JSON.stringify(settings)));
  }, [settings, id]);

  useEffect(() => {
    setSaveAction(() => handleSave);
    setResetAction(() => handleReset);
  }, [handleSave, handleReset, setSaveAction, setResetAction]);

  const toggleCategoryEnabled = (category) => {
    if (saving || category === "All") return;
    setSettings((prev) => {
      const isCurrentlyDisabled = prev.disabledCategories.includes(category);
      if (isCurrentlyDisabled) {
        return {
          ...prev,
          disabledCategories: prev.disabledCategories.filter(
            (c) => c !== category,
          ),
        };
      } else {
        return {
          ...prev,
          disabledCategories: [...prev.disabledCategories, category],
        };
      }
    });
  };

  const toggleCommand = (commandName, category) => {
    if (settings.disabledCategories.includes(category)) return;
    if (saving) return;

    setSettings((prev) => {
      const isCurrentlyDisabled = prev.disabledCommands.includes(commandName);
      if (isCurrentlyDisabled) {
        return {
          ...prev,
          disabledCommands: prev.disabledCommands.filter(
            (c) => c !== commandName,
          ),
        };
      } else {
        return {
          ...prev,
          disabledCommands: [...prev.disabledCommands, commandName],
        };
      }
    });
  };

  const filteredCommands = useMemo(() => {
    let result = commands;
    if (selectedCategory !== "All") {
      result = result.filter((c) => c.category === selectedCategory);
    }
    if (searchQuery) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return result;
  }, [commands, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = commands.length;
    let disabled = 0;
    commands.forEach((c) => {
      const isCatDisabled = (settings.disabledCategories || []).includes(
        c.category,
      );
      const isCmdDisabled = (settings.disabledCommands || []).includes(c.name);

      if (isCatDisabled || isCmdDisabled) {
        disabled++;
      }
    });
    return { total, disabled, active: total - disabled };
  }, [commands, settings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading server commands...</p>
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
          <div className="mb-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white via-blue-100 to-primary bg-clip-text text-transparent flex items-center gap-2">
                  <Terminal size={28} className="text-primary" />
                  Commands Manager
                </h1>
                <p className="text-sm text-gray-400">
                  Enable or disable commands for your server independent of each
                  other.
                </p>
              </div>

              {/* Stats Summary */}
              <div className="flex items-center gap-4">
                <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-500/20">
                  <Activity size={16} className="text-primary" />
                  <span className="text-sm font-bold">{stats.active}</span>
                </div>
                <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 border border-red-500/20">
                  <PowerOff size={16} className="text-red-400" />
                  <span className="text-sm font-bold">{stats.disabled}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 flex flex-col">
            {/* Category Horizontal Menu */}
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <Filter size={16} className="text-primary" />
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-500">
                  Modules
                </h3>
              </div>
              <div className="flex flex-nowrap pb-3">
                {categories.map((cat) => {
                  const isCatDisabled =
                    settings.disabledCategories.includes(cat);
                  const meta = categoryMetadata[cat.toLowerCase()] || {
                    icon: CommandIcon,
                    color: "gray",
                  };
                  const Icon = meta.icon;

                  return (
                    <div key={cat} className="flex-shrink-0 group relative p-1">
                      <button
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all border ${
                          selectedCategory === cat
                            ? "bg-gradient-blue-glow text-white shadow-glow border-primary/50 font-semibold"
                            : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={
                            selectedCategory === cat
                              ? "text-white"
                              : "text-gray-500 group-hover:text-primary transition-colors"
                          }
                        />
                        <span className="capitalize text-sm whitespace-nowrap">
                          {cat}
                        </span>

                        {cat !== "All" && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategoryEnabled(cat);
                            }}
                            className={`ml-1 p-0.5 rounded-md transition-all ${
                              isCatDisabled
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            }`}
                            title={
                              isCatDisabled ? "Enable Module" : "Disable Module"
                            }
                          >
                            {isCatDisabled ? (
                              <PowerOff size={10} />
                            ) : (
                              <Power size={10} />
                            )}
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Search Bar */}
            <div
              className="relative animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search commands by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-shadow border border-white/10 rounded-xl py-3 pl-12 pr-6 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-elevation"
              />
            </div>

            {/* Commands Grid */}
            <div className="flex-1">
              {filteredCommands.length > 0 ? (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  {filteredCommands.map((cmd) => (
                    <CommandCard
                      key={cmd.name}
                      command={cmd}
                      isDisabled={
                        settings.disabledCommands.includes(cmd.name) ||
                        settings.disabledCategories.includes(cmd.category)
                      }
                      isLocked={settings.disabledCategories.includes(
                        cmd.category,
                      )}
                      onToggle={() => toggleCommand(cmd.name, cmd.category)}
                      saving={saving}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-shadow rounded-[2.5rem] border border-dashed border-white/10 animate-fade-in">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Search size={40} className="text-gray-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-400 mb-2">
                    No commands found
                  </p>
                  <p className="text-gray-500">
                    Try adjusting your search or category filter
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function CommandCard({ command, isDisabled, isLocked, onToggle, saving }) {
  const categoryColors = {
    moderation: "from-red-500/20 to-red-600/20 border-red-500/30",
    utility: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    fun: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    leveling: "from-green-500/20 to-green-600/20 border-green-500/30",
    music: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
    admin: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
    giveaway: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
    ticket: "from-teal-500/20 to-teal-600/20 border-teal-500/30",
    invites: "from-sky-500/20 to-sky-600/20 border-sky-500/30",
    reaction_role: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30",
  };

  const categoryColor =
    categoryColors[command.category?.toLowerCase()] ||
    "from-gray-500/20 to-gray-600/20 border-gray-500/30";

  const regularOptions = command.options?.filter(
    (o) =>
      ![1, 2, "1", "2", "SUB_COMMAND", "SUB_COMMAND_GROUP"].includes(o.type) &&
      o.type !== undefined,
  );

  return (
    <div
      className={`group relative card overflow-hidden flex flex-col h-full transition-all duration-300 ${
        isDisabled ? "opacity-80 grayscale-[0.2]" : ""
      } ${isLocked ? "cursor-not-allowed" : ""}`}
    >
      {/* Background Gradient on Hover */}
      {!isLocked && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            categoryColor.split(" ")[0]
          } ${
            categoryColor.split(" ")[1]
          } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        ></div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-glow transition-all duration-300 ${
                  isDisabled
                    ? "bg-gray-500/10 text-gray-500 border-gray-500/20"
                    : ""
                }`}
              >
                <CommandIcon size={22} />
              </div>
              {command.isSubcommand && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-void"
                  title="Sub-command"
                >
                  <PlusIcon size={10} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white group-hover:text-gradient-blue transition-all">
                  /{command.name}
                </h3>
                {isLocked && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 uppercase font-black tracking-tighter">
                    Locked
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-gradient-to-r ${
                  categoryColor.split(" ")[0]
                } ${categoryColor.split(" ")[1]} border ${
                  categoryColor.split(" ")[2]
                }`}
              >
                {command.category}
              </span>
            </div>
          </div>

          <button
            onClick={onToggle}
            disabled={isLocked || saving}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              isLocked || saving
                ? "bg-gray-800 cursor-not-allowed"
                : isDisabled
                ? "bg-red-500/20 border border-red-500/40"
                : "bg-emerald-500/20 border border-emerald-500/40"
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full shadow-lg transition-all duration-300 ${
                isLocked || saving
                  ? "left-1 bg-gray-600"
                  : isDisabled
                  ? "left-1 bg-red-500"
                  : "right-1 bg-emerald-500"
              }`}
            ></div>
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-6 leading-relaxed text-sm flex-1">
          {command.description}
        </p>

        {/* Options / Args */}
        {regularOptions && regularOptions.length > 0 && (
          <div className="pt-4 border-t border-white/5">
            <div className="text-[10px] text-gray-500 mb-2 font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-3 bg-primary/40 rounded-full"></div>
              Options - Required(*)
            </div>
            <div className="flex flex-wrap gap-2">
              {regularOptions.map((o) => (
                <span
                  key={o.name}
                  className="px-2 py-1 glass rounded-md text-[10px] text-gray-400 border border-white/5 font-medium"
                >
                  {o.name}
                  {o.required ? "*" : ""}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
