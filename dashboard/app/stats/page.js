"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import {
  Server,
  Users,
  Zap,
  Clock,
  Activity,
  TrendingUp,
  Award,
  Target,
} from "lucide-react";
import { formatUptime } from "@/utils/formatUptime";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function Stats() {
  const [errorVisible, setErrorVisible] = useState(null);
  const [stats, setStats] = useState({
    totalServers: "...",
    totalUsers: "...",
    commands: "...",
    uptime: "...",
    trends: {
      guilds: { value: "...", isPositive: true },
      users: { value: "...", isPositive: true },
      commands: { value: "...", isPositive: true },
    },
    chartData: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    },
    topCommands: [],
    performance: {
      ping: "...",
      activeServers: "...",
    },
  });

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  useEffect(() => {
    // Try to load from localStorage first
    const cachedStats = localStorage.getItem("vantyx_full_stats");
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        console.error("Failed to parse cached full stats:", e);
      }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/proxy/stats");
        const data = await res.json();

        if (data && data._isError) {
          setStats((prev) => ({ ...prev, uptime: "Offline" }));
          return;
        }

        const newStats = {
          totalServers: (data.totalGuilds || 0).toLocaleString(),
          totalUsers: (data.totalUsers || 0).toLocaleString(),
          uptime: data.isOffline ? "Offline" : formatUptime(data.uptime),
          commands: (data.totalCommands || 0).toLocaleString(),
          trends: data.trends || {
            guilds: { value: "+0%", isPositive: true },
            users: { value: "+0%", isPositive: true },
            commands: { value: "+0%", isPositive: true },
          },
          chartData: {
            labels: data.chartData?.labels?.length
              ? data.chartData.labels
              : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "Command Usage",
                data: data.chartData?.data?.length
                  ? data.chartData.data
                  : [0, 0, 0, 0, 0, 0, 0],
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: "#3b82f6",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointHoverBackgroundColor: "#60a5fa",
                pointHoverBorderColor: "#ffffff",
              },
            ],
          },
          topCommands: data.topCommands || [],
          performance: data.performance || { ping: "0ms", activeServers: "0" },
        };
        setStats(newStats);
        localStorage.setItem("vantyx_full_stats", JSON.stringify(newStats));
      } catch (err) {
        setStats((prev) => ({ ...prev, uptime: "Offline" }));
      }
    };

    fetchStats();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(18, 18, 26, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "rgba(59, 130, 246, 0.3)",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `Commands: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255, 255, 255, 0.05)", drawBorder: false },
        ticks: {
          color: "#9ca3af",
          font: { size: 12, weight: "500" },
          padding: 10,
          precision: 0, // Force integers
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#9ca3af",
          font: { size: 12, weight: "500" },
          padding: 10,
        },
        border: { display: false },
      },
    },
    elements: {
      line: {
        tension: 0.4, // Smooth curves
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
      },
    },
  };

  return (
    <div className="min-h-screen bg-void text-white">
      <Navbar />

      <div className="pt-32 pb-20 container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <Activity size={16} className="text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">
              Live Statistics
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Bot Statistics
          </h1>
          <p className="text-gray-400 text-xl">
            Real-time metrics and analytics
          </p>
        </div>

        {/* Global Stats Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <MetricCard
            icon={Server}
            label="Total Servers"
            value={stats.totalServers}
            trend={stats.trends.guilds.value}
            trendUp={stats.trends.guilds.isPositive}
            color="blue"
          />
          <MetricCard
            icon={Users}
            label="Total Users"
            value={stats.totalUsers}
            trend={stats.trends.users.value}
            trendUp={stats.trends.users.isPositive}
            color="purple"
          />
          <MetricCard
            icon={Zap}
            label="Commands Run"
            value={stats.commands}
            trend={stats.trends.commands.value}
            trendUp={stats.trends.commands.isPositive}
            color="yellow"
          />
          <MetricCard
            icon={Clock}
            label="Uptime"
            value={stats.uptime}
            trend="Live"
            trendUp={true}
            color="green"
          />
        </div>

        {/* Charts Section */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Main Chart */}
          <div className="lg:col-span-2 card-hover">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  Command Usage History
                </h3>
                <p className="text-gray-400 text-sm">Last 7 days activity</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm font-medium">
                <TrendingUp size={16} className="text-emerald-400" />
                <span className="text-emerald-400">
                  {stats.trends.commands.value}
                </span>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <Line data={stats.chartData} options={options} />
            </div>
          </div>

          {/* Top Commands */}
          <div className="card-hover">
            <div className="flex items-center gap-2 mb-6">
              <Award size={24} className="text-primary" />
              <h3 className="text-2xl font-bold text-white">Top Commands</h3>
            </div>
            <div className="space-y-4">
              {stats.topCommands.length > 0 ? (
                stats.topCommands.map((cmd, i) => (
                  <CommandItem key={i} {...cmd} />
                ))
              ) : (
                <div className="text-gray-500 text-center py-8">
                  No commands used yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          <InfoCard
            icon={Target}
            title="Average Response Time"
            value={stats.performance.ping}
            description="Lightning fast command execution"
            color="cyan"
          />
          <InfoCard
            icon={Activity}
            title="Active Servers"
            value={stats.performance.activeServers}
            description="Servers with recent activity"
            color="green"
          />
          <InfoCard
            icon={TrendingUp}
            title="Growth Rate"
            value={stats.trends.guilds.value}
            description="Month over month growth"
            color="purple"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, trend, trendUp, color }) {
  const colorClasses = {
    blue: "text-blue-400 bg-blue-400/10",
    purple: "text-purple-400 bg-purple-400/10",
    yellow: "text-yellow-400 bg-yellow-400/10",
    green: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className="card-hover group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs font-bold">
          <Activity size={12} />
          Live
        </div>
      </div>
      <div className="text-4xl font-bold mb-2 text-white">{value}</div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400 font-medium">{label}</div>
        <div
          className={`text-sm font-bold ${
            trendUp ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {trend}
        </div>
      </div>
    </div>
  );
}

// Command Item Component
function CommandItem({ name, count, percent, rank }) {
  return (
    <div className="group">
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {rank}
          </div>
          <span className="font-semibold text-gray-200 group-hover:text-primary transition-colors">
            /{name}
          </span>
        </div>
        <span className="text-gray-400 font-medium">{count}</span>
      </div>
      <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-blue-glow rounded-full transition-all duration-1000 shadow-glow-sm"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({ icon: Icon, title, value, description, color }) {
  const colorClasses = {
    cyan: "text-cyan-400 bg-cyan-400/10",
    green: "text-emerald-400 bg-emerald-400/10",
    purple: "text-purple-400 bg-purple-400/10",
  };

  return (
    <div className="card-hover text-center group">
      <div
        className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon size={28} />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-300 mb-2">{title}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </div>
  );
}
