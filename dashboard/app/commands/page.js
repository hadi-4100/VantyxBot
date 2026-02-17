"use client";
import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Command, ChevronRight, Sparkles, Filter } from "lucide-react";

export default function Commands() {
  const [commands, setCommands] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    // Try to load from localStorage first
    const cachedCommands = localStorage.getItem("vantyx_commands");
    if (cachedCommands) {
      try {
        const parsed = JSON.parse(cachedCommands);
        setCommands(parsed.commands);
        setCategories(parsed.categories);
      } catch (e) {
        console.error("Failed to parse cached commands:", e);
      }
    }

    const fetchCommands = async () => {
      try {
        const res = await fetch("/api/proxy/commands");
        const data = await res.json();

        if (data && data._isError) {
          return; // Stay with cached data
        }

        const allCommands = Object.values(data).flat();

        // Process commands to separate sub-commands into independent items
        const processedCommands = [];
        allCommands.forEach((cmd) => {
          const subcommands = cmd.options?.filter((o) =>
            [1, 2, "1", "2"].includes(o.type),
          );

          if (subcommands && subcommands.length > 0) {
            subcommands.forEach((sub) => {
              processedCommands.push({
                ...cmd,
                name: `${cmd.name} ${sub.name}`,
                description: sub.description,
                options: sub.options || [],
                isSubcommand: true,
                parentName: cmd.name,
              });
            });
          } else {
            processedCommands.push(cmd);
          }
        });

        setCommands(processedCommands);
        const cats = [
          "All",
          ...new Set(processedCommands.map((c) => c.category)),
        ];
        setCategories(cats);

        // Save to cache
        localStorage.setItem(
          "vantyx_commands",
          JSON.stringify({
            commands: processedCommands,
            categories: cats,
          }),
        );
      } catch (err) {
        console.error("Failed to fetch commands:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  const commandsByCategory = useMemo(() => {
    const grouped = {};
    commands.forEach((cmd) => {
      const cat = cmd.category || "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(cmd);
    });
    return grouped;
  }, [commands]);

  const filteredCommands = useMemo(() => {
    let result = commands;
    if (selectedCategory !== "All") {
      result = result.filter((c) => c.category === selectedCategory);
    }
    if (search) {
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()) ||
          (c.options &&
            c.options.some((o) =>
              o.name.toLowerCase().includes(search.toLowerCase()),
            )),
      );
    }
    return result;
  }, [search, selectedCategory, commands]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading commands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-semibold text-primary">
              {commands.length} Commands Available
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Commands
          </h1>
          <p className="text-gray-400 text-xl">
            Explore the full power of Vantyx
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Categories */}
          <div
            className="lg:w-72 flex-shrink-0 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="card sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Filter size={20} className="text-primary" />
                <h3 className="font-bold text-lg text-white">Categories</h3>
              </div>
              <div className="space-y-2">
                {categories.map((cat, index) => (
                  <button
                    key={index} // Use a unique key
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${
                      selectedCategory === cat
                        ? "bg-gradient-blue-glow text-white shadow-glow font-semibold"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="capitalize">{cat}</span>
                    {selectedCategory === cat && (
                      <ChevronRight size={18} className="animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-sm text-gray-400 mb-2">Showing</div>
                <div className="text-2xl font-bold text-white">
                  {filteredCommands.length}
                </div>
                <div className="text-xs text-gray-500">
                  of {commands.length} commands
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div
              className="relative mb-8 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <Search
                className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
                size={22}
              />
              <input
                type="text"
                placeholder="Search commands by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-shadow border border-white/10 rounded-xl py-4 pl-14 pr-6 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Commands Grid */}
            {filteredCommands.length > 0 ? (
              <div
                className="h-[800px] overflow-y-auto custom-scrollbar pr-2 animate-fade-in-up pt-2"
                style={{ animationDelay: "0.3s" }}
              >
                {selectedCategory === "All" && !search ? (
                  Object.keys(commandsByCategory)
                    .sort()
                    .map((category) => (
                      <div key={category} className="mb-12 last:mb-0">
                        <div className="flex items-center gap-3 mb-6 px-2">
                          <div className="w-1.5 h-8 bg-primary rounded-full shadow-glow"></div>
                          <h2 className="text-2xl font-bold capitalize text-white flex items-center gap-2">
                            {category}
                            <span className="text-sm font-normal text-gray-500 ml-2">
                              ({commandsByCategory[category].length})
                            </span>
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {commandsByCategory[category].map((cmd) => (
                            <CommandCard key={cmd.name} command={cmd} />
                          ))}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCommands.map((cmd) => (
                      <CommandCard key={cmd.name} command={cmd} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Search size={40} className="text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-400 mb-2">
                  No commands found
                </p>
                <p className="text-gray-500">
                  Try adjusting your search or filter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Command Card Component
function CommandCard({ command }) {
  const categoryColors = {
    moderation: "from-red-500/20 to-red-600/20 border-red-500/30",
    utility: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    fun: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    leveling: "from-green-500/20 to-green-600/20 border-green-500/30",
    music: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
    admin: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
    giveaway: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
    ticket: "from-teal-500/20 to-teal-600/20 border-teal-500/30",
  };

  const categoryColor =
    categoryColors[command.category?.toLowerCase()] ||
    "from-gray-500/20 to-gray-600/20 border-gray-500/30";

  // Separate subcommands and groups from regular options
  const subcommands = command.options?.filter((o) =>
    [1, 2, "1", "2"].includes(o.type),
  );
  const regularOptions = command.options?.filter(
    (o) =>
      ![1, 2, "1", "2", "SUB_COMMAND", "SUB_COMMAND_GROUP"].includes(o.type) &&
      o.type !== undefined,
  );

  return (
    <div className="group relative card-hover overflow-hidden flex flex-col h-full">
      {/* Gradient Background on Hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          categoryColor.split(" ")[0]
        } ${
          categoryColor.split(" ")[1]
        } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      ></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-glow transition-all">
              <Command size={22} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white group-hover:text-gradient-blue transition-all">
                /{command.name}
              </h3>
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
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-6 leading-relaxed text-sm">
          {command.description}
        </p>

        {/* Arguments/Options */}
        {regularOptions && regularOptions.length > 0 && (
          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="text-xs text-gray-400 mb-3 font-bold uppercase tracking-widest flex items-center gap-2">
              <div className="w-1 h-3 bg-secondary rounded-full"></div>
              Options
            </div>
            <div className="flex flex-wrap gap-2">
              {regularOptions.map((o) => (
                <span
                  key={o.name}
                  className="px-2.5 py-1 glass rounded-md text-[11px] text-gray-300 border border-white/10 font-medium hover:border-primary/20 transition-colors"
                  title={o.description}
                >
                  {o.name}
                  {o.required && <span className="text-red-400 ml-0.5">*</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
