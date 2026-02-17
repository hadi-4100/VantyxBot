"use client";
import { useEffect, useState, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp,
  Activity,
  Users,
  MessageSquare,
  UserPlus,
  UserMinus,
  Settings,
  Shield,
  Clock,
  ChevronRight,
  Edit,
  FileText,
  Gift,
  Hash,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { api } from "@/utils/api";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function ServerOverview({ params }) {
  const { id } = use(params);
  const [guild, setGuild] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [guildData, statsData] = await Promise.all([
          api.get(`/guilds/${id}`),
          api.get(`/stats/guild/${id}`),
        ]);

        if (!guildData || (!guildData.id && !guildData._id)) {
          const err = new Error("Guild not found or inaccessible");
          err.status = 404;
          err.isApiError = true;
          setErrorVisible(err);
          throw err;
        }

        setGuild(guildData);
        setStats(statsData || {});
      } catch (err) {
        err.isApiError = true;
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading server data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void text-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        <Sidebar guildId={id} />

        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-100 to-primary bg-clip-text text-transparent">
              Server Overview
            </h1>
            <p className="text-gray-400">
              Real-time statistics and activity for the last 7 days
            </p>
          </div>

          {/* 24h Statistics */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            <StatCard
              icon={MessageSquare}
              label="New Messages"
              value={stats?.last7Days?.messages || 0}
              trend={stats?.trends?.messages?.value ?? null}
              trendUp={stats?.trends?.messages?.isPositive !== false}
              color="blue"
            />
            <StatCard
              icon={UserPlus}
              label="Joins"
              value={stats?.last7Days?.joins || 0}
              trend={stats?.trends?.joins?.value ?? null}
              trendUp={stats?.trends?.joins?.isPositive !== false}
              color="green"
            />
            <StatCard
              icon={UserMinus}
              label="Leaves"
              value={stats?.last7Days?.leaves || 0}
              trend={stats?.trends?.leaves?.value ?? null}
              trendUp={stats?.trends?.leaves?.isPositive !== false}
              color="red"
            />
            <StatCard
              icon={Users}
              label="Total Members"
              value={stats?.last7Days?.totalMembers || 0}
              trend={null}
              trendUp={true}
              color="purple"
            />
          </div>

          {/* Charts Section */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Messages Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-400" />
                    Message Activity
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Messages last 7 days (excluding bots)
                  </p>
                </div>
              </div>
              <div className="h-64">
                <Line
                  data={{
                    labels: stats?.charts?.messages?.labels || [],
                    datasets: [
                      {
                        label: "Messages",
                        data: stats?.charts?.messages?.data || [],
                        borderColor: "rgb(59, 130, 246)",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: "rgb(59, 130, 246)",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: 12,
                        titleColor: "#fff",
                        bodyColor: "#fff",
                        borderColor: "rgba(59, 130, 246, 0.5)",
                        borderWidth: 1,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255, 255, 255, 0.05)" },
                        ticks: { color: "#9ca3af" },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: "#9ca3af" },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Member Flow Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-400" />
                    Member Flow
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Joins vs Leaves last 7 days
                  </p>
                </div>
              </div>
              <div className="h-64">
                <Bar
                  data={{
                    labels: stats?.charts?.memberflow?.labels || [],
                    datasets: [
                      {
                        label: "Joins",
                        data: stats?.charts?.memberflow?.joins || [],
                        backgroundColor: "rgba(16, 185, 129, 0.8)",
                        borderColor: "rgb(16, 185, 129)",
                        borderWidth: 1,
                      },
                      {
                        label: "Leaves",
                        data: stats?.charts?.memberflow?.leaves || [],
                        backgroundColor: "rgba(239, 68, 68, 0.8)",
                        borderColor: "rgb(239, 68, 68)",
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: "top",
                        labels: { color: "#9ca3af", padding: 15 },
                      },
                      tooltip: {
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        padding: 12,
                        titleColor: "#fff",
                        bodyColor: "#fff",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255, 255, 255, 0.05)" },
                        ticks: { color: "#9ca3af", stepSize: 1 },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: "#9ca3af" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity size={24} className="text-primary" />
              Recent Activity
            </h2>
            <div className="card">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {stats.recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    No recent activity to display
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Activity will appear here as you manage your server
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

function StatCard({ icon: Icon, label, value, trend, trendUp, color }) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    green: "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30",
    red: "from-red-500/20 to-red-600/20 border-red-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  };

  const iconColors = {
    blue: "text-blue-400",
    green: "text-emerald-400",
    red: "text-red-400",
    purple: "text-purple-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm p-6 group hover:scale-105 transition-all duration-300`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ${iconColors[color]}`}
          >
            <Icon size={24} />
          </div>
          {typeof trend === "number" && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                trendUp ? "text-emerald-400" : "text-red-400"
              }`}
            >
              <TrendingUp size={16} className={trendUp ? "" : "rotate-180"} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm text-gray-300 font-medium">{label}</div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const [showFullTime, setShowFullTime] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case "settings_change":
        return <Settings size={18} className="text-blue-400" />;
      case "feature_toggle":
        return <Shield size={18} className="text-emerald-400" />;
      case "channel_update":
        return <Hash size={18} className="text-gray-400" />;
      case "role_update":
        return <Tag size={18} className="text-pink-400" />;
      case "welcome_update":
      case "goodbye_update":
        return <UserPlus size={18} className="text-green-400" />;
      case "leveling_update":
      case "leveling_reward_add":
      case "leveling_reward_update":
      case "leveling_reward_delete":
        return <TrendingUp size={18} className="text-yellow-400" />;
      case "warnings_update":
      case "log_update":
        return <AlertTriangle size={18} className="text-orange-400" />;
      case "autoresponder_add":
      case "autoresponder_update":
      case "autoresponder_delete":
      case "autoresponder_bulk_update":
        return <MessageSquare size={18} className="text-indigo-400" />;
      case "tickets_update":
        return <FileText size={18} className="text-cyan-400" />;
      case "invites_update":
        return <Users size={18} className="text-purple-400" />;
      case "reaction_role_update":
        return <Activity size={18} className="text-rose-400" />;
      case "embed_create":
      case "embed_update":
      case "embed_delete":
        return <Edit size={18} className="text-blue-500" />;
      case "giveaway_create":
      case "giveaway_end":
      case "giveaway_reroll":
      case "giveaway_delete":
      case "giveaway_update":
        return <Gift size={18} className="text-red-400" />;
      default:
        return <Activity size={18} className="text-gray-400" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group border border-white/5">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        {getIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{activity.action}</p>
        <p className="text-sm text-gray-400">by {activity.user}</p>
        {activity.userId && (
          <p className="text-xs text-gray-600 mt-0.5 font-mono">
            {activity.userId}
          </p>
        )}
      </div>
      <div
        className="flex items-center gap-2 text-gray-400 text-sm flex-shrink-0 cursor-pointer hover:text-white transition-colors"
        onClick={() => setShowFullTime(!showFullTime)}
        title={new Date(activity.timestamp).toLocaleString()}
      >
        <Clock size={14} />
        {showFullTime
          ? new Date(activity.timestamp).toLocaleString()
          : formatTime(activity.timestamp)}
      </div>
      <ChevronRight
        size={18}
        className="text-gray-600 group-hover:text-primary transition-colors"
      />
    </div>
  );
}
