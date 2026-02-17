"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  LayoutDashboard,
  TrendingUp,
  FileText,
  UserPlus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Gift,
  Terminal,
  Shield,
  MessageSquare,
  PlusCircle,
  Ticket,
  SmilePlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/utils/api";

export default function Sidebar({ guildId }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [guildData, setGuildData] = useState(null);

  useEffect(() => {
    const fetchGuildData = async () => {
      try {
        const data = await api.get(`/guilds/${guildId}`);
        setGuildData(data);
      } catch (error) {
        console.error("Failed to fetch guild data in Sidebar:", error);
      }
    };

    if (guildId) {
      fetchGuildData();
    }
  }, [guildId]);

  const navItems = [
    {
      href: `/servers/${guildId}`,
      icon: LayoutDashboard,
      label: "Overview",
      group: "main",
    },
    {
      href: `/servers/${guildId}/commands`,
      icon: Terminal,
      label: "Commands",
      group: "main",
    },
    {
      href: `/servers/${guildId}/embeds`,
      icon: Layout,
      label: "Embed Generator",
      group: "main",
    },
    {
      href: `/servers/${guildId}/automod`,
      icon: Shield,
      label: "Auto-Moderation",
      group: "moderation",
    },
    {
      href: `/servers/${guildId}/warnings`,
      icon: AlertTriangle,
      label: "Warnings",
      group: "moderation",
    },
    {
      href: `/servers/${guildId}/logs`,
      icon: FileText,
      label: "Logs",
      group: "moderation",
    },
    {
      href: `/servers/${guildId}/welcomer`,
      icon: UserPlus,
      label: "Welcome-Goodbye",
      group: "features",
    },
    {
      href: `/servers/${guildId}/auto-responder`,
      icon: MessageSquare,
      label: "Auto Responder",
      group: "features",
    },
    {
      href: `/servers/${guildId}/leveling`,
      icon: TrendingUp,
      label: "Leveling",
      group: "features",
    },
    {
      href: `/servers/${guildId}/invites`,
      icon: PlusCircle,
      label: "Invites",
      group: "features",
    },
    {
      href: `/servers/${guildId}/giveaways`,
      icon: Gift,
      label: "Giveaways",
      group: "features",
    },
    {
      href: `/servers/${guildId}/tickets`,
      icon: Ticket,
      label: "Tickets",
      group: "features",
    },
    {
      href: `/servers/${guildId}/reaction_role`,
      icon: SmilePlus,
      label: "Self-Assignable Roles",
      group: "features",
    },
  ];

  const groupedItems = {
    main: navItems.filter((item) => item.group === "main"),
    moderation: navItems.filter((item) => item.group === "moderation"),
    features: navItems.filter((item) => item.group === "features"),
  };

  const handleBackToList = () => {
    router.push("/servers");
  };
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block fixed left-0 top-20 h-[calc(100vh-5rem)] bg-gradient-to-b from-abyss to-abyss/95 border-r border-white/10 backdrop-blur-xl transition-all duration-300 z-40 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Server Header */}
          {!guildData && !collapsed ? (
            // Skeleton Loader
            <div className="p-4 mb-2 animate-pulse">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-gray-600" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-gray-600 rounded w-3/4" />
                  <div className="h-3 bg-gray-500 rounded w-1/2" />
                  <div className="h-6 w-32 bg-gray-700 rounded mt-1" />
                </div>
              </div>
            </div>
          ) : guildData && guildData.name && !collapsed ? (
            <div className="p-4 mb-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 shadow-xl backdrop-blur-sm group hover:border-primary/40 transition-all duration-300">
                {/* Guild Icon */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-300">
                    {guildData.icon ? (
                      <Image
                        src={`https://cdn.discordapp.com/icons/${guildData._id}/${guildData.icon}.png`}
                        alt={guildData.name}
                        className="w-full h-full object-cover"
                        width={48}
                        height={48}
                        unoptimized
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {guildData.name[0]?.toUpperCase() || "S"}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                </div>

                {/* Guild Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-white truncate text-sm group-hover:text-primary transition-colors">
                    {guildData.name}
                  </h2>
                  <div className="flex flex-col mt-1">
                    <span className="text-[10px] font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                      ID: {guildData._id}
                    </span>

                    {/* Back Button */}
                    <button
                      onClick={handleBackToList}
                      className="mt-2 self-start px-2 py-1 bg-gray-800 text-white text-xs rounded-lg shadow hover:bg-gray-700 transition-colors duration-200"
                    >
                      ← Back to Server List
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {guildData && guildData.name && collapsed && (
            <div className="p-4 mb-2 flex justify-center">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 cursor-help"
                title={guildData.name}
              >
                {guildData.icon ? (
                  <Image
                    src={`https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png`}
                    alt={guildData.name}
                    className="w-full h-full object-cover"
                    width={64}
                    height={64}
                    unoptimized
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {guildData.name[0]?.toUpperCase() || "S"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Main Section */}
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Dashboard
                  </h3>
                </div>
              )}
              {groupedItems.main.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>

            {/* Moderation Section */}
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Moderation
                  </h3>
                </div>
              )}
              {groupedItems.moderation.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>

            {/* Features Section */}
            <div className="space-y-1">
              {!collapsed && (
                <div className="px-3 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Features
                  </h3>
                </div>
              )}
              {groupedItems.features.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </nav>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-white/10 bg-abyss/50">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/5"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight
                  size={20}
                  className="text-gray-400 group-hover:text-primary transition-colors"
                />
              ) : (
                <>
                  <ChevronLeft
                    size={20}
                    className="text-gray-400 group-hover:text-primary transition-colors"
                  />
                  <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                    Collapse
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for content */}
      <div
        className={`hidden md:block transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      ></div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-abyss/95 backdrop-blur-xl border-t border-white/10 z-50 overflow-x-auto pb-safe">
        <div className="flex items-center p-2 gap-1 min-w-max">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all w-20 shrink-0 ${
                pathname === item.href
                  ? "text-primary bg-primary/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

function SidebarLink({ href, icon: Icon, label, active, collapsed }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
        active
          ? "bg-gradient-to-r from-primary/20 to-primary/10 text-white border border-primary/30 shadow-lg shadow-primary/10"
          : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
      }`}
      title={collapsed ? label : undefined}
    >
      {/* Active Indicator */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary to-blue-400 rounded-r-full shadow-lg shadow-primary/50"></div>
      )}

      <Icon
        size={20}
        className={`flex-shrink-0 transition-all ${
          active ? "scale-110 text-primary" : "group-hover:scale-105"
        }`}
      />

      {!collapsed && (
        <span
          className={`font-medium truncate text-sm ${
            active ? "font-semibold" : ""
          }`}
        >
          {label}
        </span>
      )}

      {!collapsed && active && (
        <div className="ml-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50"></div>
        </div>
      )}
    </Link>
  );
}
