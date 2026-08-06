import { useState } from "react";
import { MessageSquareCode, Search, CheckCircle, Flame, Star, ThumbsUp, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@ui/index";
import { cn } from "@utils/index";
import { useAdminFeedback, useUpdateFeedbackStatus, useDeleteFeedback } from "@/services/admin/hooks";

export function AdminFeedbackPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: feedbacks = [], isLoading: loading, refetch } = useAdminFeedback();
  const { mutateAsync: updateStatus } = useUpdateFeedbackStatus();
  const { mutateAsync: deleteFeedback } = useDeleteFeedback();

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateStatus({ id, status: newStatus });
    } catch (err) {
      console.error("Failed to update feedback status:", err);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback submission?")) return;
    try {
      await deleteFeedback(id);
    } catch (err) {
      console.error("Failed to delete feedback:", err);
    }
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    const profileObj = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
    const matchesSearch =
      f.comment?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || f.category === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            SaaS Feedback &amp; Feature Roadmap
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review user rating scores, audit feature requests, upvote bugs, and manage product roadmap statuses.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-xs font-heading font-bold text-orange-400 transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Feedback
        </button>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-white/[0.08] pb-4">
          <span className="font-heading text-sm font-bold text-white flex items-center gap-2">
            <MessageSquareCode className="h-4 w-4 text-orange-400" /> User Feedback Queue ({filteredFeedbacks.length})
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feedback comments..."
                className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="rating">Rating &amp; Review</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <span className="text-xs text-neutral-500 font-mono">Loading feedback submissions...</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-500 font-mono">
            No feedback entries found.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFeedbacks.map((f) => {
              const profileObj = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
              const cat = f.category || "feature_request";
              const currentStatus = f.status || "under_review";

              return (
                <div key={f.id} className="flex justify-between items-start text-xs border-b border-white/[0.04] pb-4 last:border-b-0 last:pb-0">
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase font-bold",
                          cat === "bug_report"
                            ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                            : cat === "feature_request"
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}
                      >
                        {cat.replace("_", " ")}
                      </Badge>

                      {f.rating && (
                        <div className="flex items-center gap-1 text-amber-400 text-[11px]">
                          <Star className="h-3 w-3 fill-amber-400" />
                          <span className="font-bold">{f.rating} / 5</span>
                        </div>
                      )}

                      <span className="text-neutral-500 text-[10px] font-mono">
                        {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-neutral-200 leading-relaxed font-sans max-w-3xl font-medium">"{f.comment}"</p>

                    <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-mono">
                      <span>Author: {profileObj?.full_name || profileObj?.email || "Anonymous"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3 text-orange-400" /> {f.votes || 1} votes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <select
                      value={currentStatus}
                      onChange={(e) => handleUpdateStatus(f.id, e.target.value)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer uppercase",
                        currentStatus === "completed"
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : currentStatus === "planned"
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : currentStatus === "under_review"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-neutral-800 border-white/10 text-neutral-400"
                      )}
                    >
                      <option value="under_review" className="bg-neutral-900 text-white">Under Review</option>
                      <option value="planned" className="bg-neutral-900 text-white">Planned</option>
                      <option value="completed" className="bg-neutral-900 text-white">Completed</option>
                      <option value="rejected" className="bg-neutral-900 text-white">Rejected</option>
                    </select>

                    <button
                      onClick={() => handleDeleteFeedback(f.id)}
                      className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] text-neutral-400 hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete Feedback Entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminFeedbackPage;
