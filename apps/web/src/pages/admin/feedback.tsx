import { useState } from "react";
import { MessageSquareCode, Search, CheckCircle, Flame, Star, ThumbsUp, HelpCircle } from "lucide-react";
import { Badge } from "@ui/index";

export function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([
    { id: "fb1", user: "John Doe", type: "bug_report", comment: "The API generator produces misaligned braces in fastify hooks code template.", status: "under_review", votes: 4 },
    { id: "fb2", user: "Jane Smith", type: "feature_request", comment: "Add Mermaid sequence diagrams compiler for documentation page.", status: "planned", votes: 12 },
    { id: "fb3", user: "Bob Johnson", type: "rating", comment: "DevCanvas visual designer has saved me 12 hours of database design time. A+", rating: 5, status: "completed", votes: 2 },
  ]);

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          SaaS Feedback & Feature Requests
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Review ratings, audit bugs, and update the community planned features roadmap boards.
        </p>
      </div>

      {/* Feedbacks list */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
        <span className="font-heading text-sm font-bold text-white block border-b border-white/[0.08] pb-3">
          User Submissions Queue
        </span>
        <div className="space-y-3.5">
          {feedbacks.map((f) => (
            <div key={f.id} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-3.5 last:border-b-0 last:pb-0">
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                    f.type === "bug_report" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                    f.type === "feature_request" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" :
                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    {f.type.replace("_", " ")}
                  </Badge>
                  <span className="text-neutral-500 text-[10px] font-mono">ID: {f.id.toUpperCase()}</span>
                </div>
                <p className="text-neutral-350 leading-relaxed font-sans max-w-2xl">"{f.comment}"</p>
                <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono">
                  <span>Author: {f.user}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-orange-400" /> {f.votes} votes</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[10px] uppercase font-bold uppercase">{f.status}</Badge>
                {f.status !== "completed" && (
                  <button
                    onClick={() => {
                      setFeedbacks(feedbacks.map((item) => item.id === f.id ? { ...item, status: "completed" } : item));
                    }}
                    className="p-1 rounded text-neutral-500 hover:text-emerald-450 hover:bg-emerald-500/10 transition-all cursor-pointer"
                    title="Mark completed"
                  >
                    <CheckCircle className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
export default AdminFeedbackPage;
