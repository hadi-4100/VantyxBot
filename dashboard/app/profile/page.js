"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/utils/api";
import {
  Server,
  Shield,
  Trophy,
  Users,
  Calendar,
  Hash,
  Award,
  Zap,
  Ticket,
  Clock,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import config from "@config";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Break immediately if error state is set
  if (errorVisible) throw errorVisible;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.get("/auth/user");

        if (!userData || !userData.id) {
          setUser(null);
        } else {
          setUser(userData);
        }

        // Fetch aggregated profile stats
        const profileStats = await api.get("/profile/stats");
        setStats(profileStats || {});
      } catch (err) {
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-void text-white">
        <Navbar />
        <div className="pt-40 flex items-center justify-center pb-40">
          <div className="text-center glass p-10 rounded-3xl max-w-lg mx-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-red-500" size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-400 mb-8">
              Please login with your Discord account to view your community
              progress.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Login with Discord
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${
        user.avatar.startsWith("a_") ? "gif" : "png"
      }?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${
        (parseInt(user.id) >> 22) % 6
      }.png`;

  const bannerUrl = user.banner
    ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${
        user.banner.startsWith("a_") ? "gif" : "png"
      }?size=1024`
    : null;

  return (
    <div className="min-h-screen bg-void text-white">
      <Navbar />

      <main className="pt-32 pb-24 container mx-auto px-4 max-w-5xl">
        {/* Profile Card Header */}
        <div className="relative glass rounded-[2.5rem] border-white/5 overflow-hidden mb-8 animate-fade-in">
          {/* Subtle Banner Background */}
          <div className="absolute top-0 left-0 right-0 h-48 overflow-hidden">
            {bannerUrl ? (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${bannerUrl})` }}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-blue-900/10 to-transparent"></div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-shadow to-transparent"></div>
          </div>

          <div className="relative pt-24 pb-10 px-8 flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-6 animate-scale-in">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
              <div className="relative w-36 h-36 rounded-full border-4 border-void overflow-hidden shadow-glow">
                <Image
                  src={avatarUrl}
                  alt={user.username}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Username & Badges */}
            <div className="mb-4 animate-fade-in-up">
              <h1 className="text-4xl font-black mb-2 flex items-center justify-center gap-3">
                {user.username}
                {config.OWNER_IDS.includes(user.id) && (
                  <div className="group relative">
                    <Award
                      size={24}
                      className="text-yellow-400 fill-yellow-400/20 shadow-glow-purple"
                    />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Developer
                    </span>
                  </div>
                )}
              </h1>
              <div className="flex items-center justify-center gap-4 text-gray-500 text-sm font-medium">
                <span className="flex items-center gap-1.5">
                  <Hash size={14} /> {user.id}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-gray-800"></span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> Joined{" "}
                  {new Date(
                    parseInt(user.id) / 4194304 + 1420070400000,
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Trophy}
            label="Giveaways Won"
            value={stats?.giveaways?.won || 0}
            subLabel={`${stats?.giveaways?.participated || 0} entries total`}
            color="yellow"
            delay="0.1s"
          />
          <StatCard
            icon={Zap}
            label="Total Experience"
            value={(stats?.engagement?.totalXp || 0).toLocaleString()}
            subLabel={`Level ${stats?.engagement?.highestLevel || 0} Peak`}
            color="blue"
            delay="0.2s"
          />
          <StatCard
            icon={Server}
            label="Administered"
            value={stats?.admin?.managedServers || 0}
            subLabel="Servers with Bot"
            color="purple"
            delay="0.3s"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dashboard Timeline */}
          <section
            className="glass rounded-3xl p-8 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Clock size={20} className="text-primary" />
              Dashboard Activity
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-black">
                    First Appearance
                  </p>
                  <p className="text-white font-bold">
                    {stats?.milestones?.firstLogin
                      ? new Date(stats.milestones.firstLogin).toLocaleString(
                          "en-US",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "Joining now..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-black">
                    Community Range
                  </p>
                  <p className="text-white font-bold">
                    Active in {stats?.engagement?.guildsActive || 0} Vantyx
                    Servers
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Social & Milestones */}
          <section
            className="glass rounded-3xl p-8 animate-fade-in-up"
            style={{ animationDelay: "0.5s" }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Ticket size={20} className="text-purple-400" />
              Recent Records
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-black text-white mb-1">
                  {stats?.moderation?.totalWarnings || 0}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Total Warnings
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center">
                <div className="text-2xl font-black text-primary mb-1">
                  {stats?.engagement?.avgLevel || 0}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  Average Level
                </div>
              </div>
            </div>

            <Link
              href="/servers"
              className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold hover:bg-primary/20 transition-all group"
            >
              Manage Servers
              <ExternalLink
                size={18}
                className="translate-x-0 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subLabel, color, delay }) {
  const colors = {
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    blue: "text-primary bg-primary/10 border-primary/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  return (
    <div
      className="group p-6 glass rounded-3xl border-white/5 hover:border-white/10 transition-all animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colors[color]} group-hover:scale-110 transition-transform`}
      >
        <Icon size={24} />
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm font-bold text-gray-300 mb-2">{label}</div>
      <div className="text-xs text-gray-500">{subLabel}</div>
    </div>
  );
}
