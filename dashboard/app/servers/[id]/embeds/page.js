"use client";
import { useEffect, useState, use } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

import {
  Plus,
  Layout,
  Trash2,
  Edit2,
  Copy,
  Clock,
  Code as CodeIcon,
  AlertCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/utils/api";
import { toast } from "sonner";

export default function EmbedsPage({ params }) {
  const { id } = use(params);
  const [embeds, setEmbeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorVisible, setErrorVisible] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // EARLY THROW: Only break to the error page if the API is down or broken
  if (errorVisible && errorVisible.isApiError) throw errorVisible;

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    name: "",
  });

  useEffect(() => {
    const fetchEmbeds = async () => {
      try {
        const data = await api.get(`/embeds/guild/${id}`);
        setEmbeds(Array.isArray(data) ? data : []);
      } catch (err) {
        setErrorVisible(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmbeds();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading embeds...</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (id, name) => {
    setDeleteModal({ show: true, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    setDeleting(true);
    try {
      await api.delete(`/embeds/guild/${id}/${deleteModal.id}`);

      setEmbeds(embeds.filter((e) => e._id !== deleteModal.id));
      toast.success(`Deleted embed "${deleteModal.name}"`);
      setDeleteModal({ show: false, id: null, name: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async (embed) => {
    if (embeds.length >= 7) {
      toast.error("You have reached the limit of 7 embeds.");
      return;
    }

    const duplicateData = {
      name: `${embed.name} (Copy)`,
      code: `${embed.code}_copy_${Math.random().toString(36).substr(2, 5)}`,
      embedData: embed.embedData,
    };

    const promise = api
      .post(`/embeds/guild/${id}`, duplicateData)
      .then((newEmbed) => {
        setEmbeds([newEmbed, ...embeds]);
        return `Duplicated "${embed.name}"`;
      });

    toast.promise(promise, {
      loading: "Duplicating embed...",
      success: (data) => data,
      error: (err) => err.message,
    });
  };

  const filteredEmbeds = embeds.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-void text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading embeds...</p>
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
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                  <Layout className="text-primary" />
                  Embed Generator
                </h1>
                <p className="text-gray-400">
                  Create and manage custom Discord embeds for your server.
                </p>
              </div>

              <Link
                href={`/servers/${id}/embeds/editor`}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  embeds.length >= 7
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/20"
                }`}
                onClick={(e) => {
                  if (embeds.length >= 7) {
                    e.preventDefault();
                    toast.error("You have reached the limit of 7 embeds.");
                  }
                }}
              >
                <Plus size={20} />
                Create Embed
              </Link>
            </div>

            {/* Stats & Limit Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                    Embeds Used
                  </span>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full ${
                      embeds.length >= 7
                        ? "bg-red-500/20 text-red-400"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {embeds.length} / 7 Limit
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold">{embeds.length}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full mb-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        embeds.length >= 7 ? "bg-red-500" : "bg-primary"
                      }`}
                      style={{ width: `${(embeds.length / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:col-span-2 flex items-center gap-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-white">How it works</h3>
                  <p className="text-sm text-gray-400">
                    Create your embed here and use it in tickets, reaction roles
                    by referencing its
                    <span className="text-primary font-mono px-1">
                      unique code
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search embeds by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              />
            </div>

            {/* Embed List */}
            {filteredEmbeds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmbeds.map((embed) => (
                  <div
                    key={embed._id}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <CodeIcon size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDuplicate(embed)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={18} />
                          </button>
                          <Link
                            href={`/servers/${id}/embeds/editor?id=${embed._id}`}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button
                            onClick={() =>
                              handleDeleteClick(embed._id, embed.name)
                            }
                            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
                        {embed.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-mono bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">
                          {embed.code}
                        </span>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Updated{" "}
                            {new Date(embed.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                  <Layout size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No embeds found
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                  {searchQuery
                    ? `No embeds match "${searchQuery}". Try a different search term.`
                    : "You haven't created any custom embeds yet. Get started by creating your first one!"}
                </p>
                {!searchQuery && (
                  <Link
                    href={`/servers/${id}/embeds/editor`}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                  >
                    <Plus size={20} />
                    Create Your First Embed
                  </Link>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111214] border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="p-4 bg-red-500/10 rounded-2xl">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-white">Delete Embed?</h3>
            </div>

            <p className="text-gray-400 mb-8 leading-relaxed text-lg font-medium">
              Are you sure you want to delete{" "}
              <span className="text-white font-bold italic">
                &quot;{deleteModal.name}&quot;
              </span>
              ? This action is permanent and cannot be undone.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  setDeleteModal({ show: false, id: null, name: "" })
                }
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all text-center border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
              >
                {deleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Delete Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
