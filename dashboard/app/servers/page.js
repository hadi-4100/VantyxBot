"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Server,
  Users,
  Crown,
  ArrowRight,
  Sparkles,
  KeyIcon,
} from "lucide-react";
import config from "@config";
import Image from "next/image";
import { api } from "@/utils/api";

export default function ServerList() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const data = await api.get("/guilds");
        // Sort servers: bot joined first, then not joined
        const sortedData = Array.isArray(data)
          ? data.sort((a, b) => {
              // botAdded servers come first (true > false)
              if (a.botAdded && !b.botAdded) return -1;
              if (!a.botAdded && b.botAdded) return 1;
              // If both have same botAdded status, maintain original order
              return 0;
            })
          : [];
        setServers(sortedData);
      } catch (err) {
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading your servers...</p>
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
            <Server size={16} className="text-primary" />
            <span className="text-sm font-semibold text-primary">
              {servers.length} Servers Available
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gradient">
            Select a Server
          </h1>
          <p className="text-gray-400 text-xl">Choose a server to manage</p>
        </div>

        {/* Server Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          {servers.map((server) => (
            <ServerCard key={server.id} server={server} />
          ))}
        </div>

        {/* Empty State */}
        {servers.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Server size={48} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-400 mb-4">
              No servers found
            </h2>
            <p className="text-gray-500 mb-8">
              You don&apos;t have access to any servers yet.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-blue-glow text-white rounded-xl font-semibold shadow-glow hover:shadow-glow-lg transition-all"
            >
              Go Home
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ServerCard({ server }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group card-hover">
      <div className="flex items-center gap-4 mb-6">
        {server.icon && !imageError ? (
          <Image
            src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
            alt={server.name}
            className="w-16 h-16 rounded-xl shadow-elevation group-hover:shadow-glow transition-all"
            onError={() => setImageError(true)}
            width={64}
            height={64}
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-blue-glow flex items-center justify-center text-white font-bold text-2xl shadow-glow">
            {server.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xl text-white truncate mb-1 group-hover:text-gradient-blue transition-all">
            {server.name}
          </h3>
          {server.memberCount ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users size={14} />
              <span>{server.memberCount.toLocaleString()} members</span>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>

      {/* Server Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {server.botAdded ? "✓" : "✗"}
          </div>
          <div className="text-xs text-gray-400">Bot Status</div>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1 mt-2">
            {server.owner ? (
              <Crown
                size={20}
                className="text-yellow-400 text-2xl font-bold mb-1"
              />
            ) : (
              <KeyIcon
                size={20}
                className="text-gray-400 text-2xl font-bold mb-1"
              />
            )}
          </div>
          <div className="text-xs text-gray-400">
            {server.owner ? "Owner" : "Manager"}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {server.botAdded ? (
        <Link
          href={`/servers/${server.id}`}
          className="group/btn flex items-center justify-center gap-2 w-full py-3 bg-gradient-blue-glow text-white rounded-xl font-semibold shadow-glow hover:shadow-glow-lg hover:scale-105 transition-all"
        >
          Manage Server
          <ArrowRight
            size={18}
            className="group-hover/btn:translate-x-1 transition-transform"
          />
        </Link>
      ) : (
        <a
          href={`${config.LINKS.INVITE}&guild_id=${server.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group/btn flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
        >
          Add Bot
          <Sparkles
            size={18}
            className="text-yellow-400 group-hover/btn:rotate-12 transition-transform"
          />
        </a>
      )}
    </div>
  );
}
