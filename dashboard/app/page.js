"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Zap,
  Gift,
  BarChart,
  Server,
  Users,
  Clock,
  FileText,
  Sparkles,
  TrendingUp,
  Bell,
} from "lucide-react";
import { formatUptime } from "@/utils/formatUptime";
import config from "@config";

export default function Home() {
  const [stats, setStats] = useState({
    totalServers: "...",
    totalUsers: "...",
    uptime: "...",
    commands: "...",
  });

  useEffect(() => {
    // Try to load from localStorage first for immediate results
    const cachedStats = localStorage.getItem("vantyx_stats");
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {
        console.error("Failed to parse cached stats:", e);
      }
    }

    // Use the reliable proxy instead of direct API to ensure cache works for everyone
    fetch("/api/proxy/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && data._isError) throw new Error("API Offline");

        const newStats = {
          totalServers: (data.totalGuilds || 0).toLocaleString(),
          totalUsers: (data.totalUsers || 0).toLocaleString(),
          uptime: data.isOffline ? "Offline" : formatUptime(data.uptime),
          commands: (data.totalCommands || 0).toLocaleString(),
        };
        setStats(newStats);
        localStorage.setItem("vantyx_stats", JSON.stringify(newStats));
      })
      .catch((err) => {
        setStats((prev) => ({ ...prev, uptime: "Offline" }));
      });
  }, []);

  return (
    <main className="min-h-screen bg-void text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute top-40 right-10 w-[500px] h-[500px] bg-blue-glow/15 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Status Badge */}
          <div className="flex justify-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-emerald-400">
                v{config.PROJECT_VERSION} is now live!
              </span>
              <Sparkles size={16} className="text-emerald-400" />
            </div>
          </div>

          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="text-gradient">Manage your server</span>
              <br />
              <span className="text-white">like a </span>
              <span className="text-gradient-blue">pro</span>
            </h1>

            <p
              className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              The all-in-one Discord bot you&apos;ve been waiting for. Advanced
              moderation, leveling, giveaways, and comprehensive logging in one{" "}
              <span className="text-primary font-semibold">
                beautiful dashboard
              </span>
              .
            </p>

            {/* CTA Buttons */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Link
                href={config.LINKS.INVITE}
                target="_blank"
                className="group px-8 py-4 bg-gradient-blue-glow text-white rounded-xl font-bold text-lg shadow-glow-lg hover:shadow-glow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2"
              >
                Add to Discord
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 glass-strong text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              icon={Server}
              label="Total Servers"
              value={stats.totalServers}
              color="blue"
            />
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats.totalUsers}
              color="cyan"
            />
            <StatCard
              icon={Clock}
              label="Uptime"
              value={stats.uptime}
              color="green"
            />
            <StatCard
              icon={Zap}
              label="Commands Run"
              value={stats.commands}
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Everything you need
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Packed with powerful features to make your server engaging, safe,
              and professional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Shield}
              title="Advanced Moderation"
              description="Keep your server safe with auto-mod, warnings, and powerful moderation tools with detailed logging."
              color="red"
              gradient="from-red-500/20 to-red-600/20"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Leveling System"
              description="Engage your community with a customizable XP system, role rewards, and interactive leaderboards."
              color="green"
              gradient="from-green-500/20 to-emerald-600/20"
            />
            <FeatureCard
              icon={Gift}
              title="Giveaways"
              description="Host fair and exciting giveaways with automatic winner selection, rerolls, and entry requirements."
              color="purple"
              gradient="from-purple-500/20 to-violet-600/20"
            />
            <FeatureCard
              icon={FileText}
              title="Comprehensive Logging"
              description="Track every action in your server with detailed logs for messages, members, roles, and more."
              color="blue"
              gradient="from-blue-500/20 to-cyan-600/20"
            />
            <FeatureCard
              icon={Bell}
              title="Welcome & Goodbye"
              description="Greet new members with customizable welcome cards, messages, and automated role assignments."
              color="yellow"
              gradient="from-yellow-500/20 to-amber-600/20"
            />
            <FeatureCard
              icon={BarChart}
              title="Analytics Dashboard"
              description="Manage everything from a beautiful, intuitive web dashboard with real-time statistics and insights."
              color="pink"
              gradient="from-pink-500/20 to-rose-600/20"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto glass-strong rounded-3xl p-12 shadow-elevation-xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
              Ready to elevate your server?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of communities already using Vantyx to create
              amazing Discord experiences.
            </p>
            <Link
              href={config.LINKS.INVITE}
              target="_blank"
              className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-blue-glow text-white rounded-xl font-bold text-xl shadow-glow-lg hover:shadow-glow-lg hover:scale-105 transition-all duration-300 group"
            >
              Get Started Now
              <ArrowRight
                size={24}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: "text-blue-400 bg-blue-400/10 shadow-glow-sm",
    cyan: "text-cyan-400 bg-cyan-400/10 shadow-glow-cyan",
    green: "text-emerald-400 bg-emerald-400/10 shadow-glow-green",
    purple: "text-purple-400 bg-purple-400/10 shadow-glow-purple",
  };

  return (
    <div className="card-hover group text-center">
      <div
        className={`w-14 h-14 rounded-xl ${colorClasses[color]} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon size={28} />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-2">
        {value}
      </div>
      <div className="text-sm text-gray-400 uppercase tracking-wider font-medium">
        {label}
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, color, gradient }) {
  const colorClasses = {
    red: "text-red-400",
    green: "text-emerald-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    pink: "text-pink-400",
  };

  return (
    <div className="group relative card-hover overflow-hidden">
      {/* Gradient Background on Hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      ></div>

      <div className="relative z-10">
        <div
          className={`w-16 h-16 rounded-xl glass flex items-center justify-center mb-6 ${colorClasses[color]} group-hover:scale-110 group-hover:shadow-glow transition-all duration-300`}
        >
          <Icon size={32} />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-gradient-blue transition-all">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
