import { useState } from "react";
import { Bell, Send, CheckCircle, Trash2, Megaphone, Clock, Info } from "lucide-react";
import { Badge } from "@ui/index";

export function AdminNotificationsPage() {
  const [targetType, setTargetType] = useState("everyone");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");

  const [activeAnnouncements, setActiveAnnouncements] = useState([
    { id: "1", title: "Scheduled DB Maintenance on July 31st", target: "Everyone", date: "2 hours ago", priority: "high" },
    { id: "2", title: "Gemini Model Upgrade to 1.5 Pro Completed", target: "Everyone", date: "1 day ago", priority: "low" },
  ]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNotif = {
      id: Date.now().toString(),
      title,
      target: targetType === "everyone" ? "Everyone" : "Selected Plan",
      date: "Just now",
      priority,
    };

    setActiveAnnouncements([newNotif, ...activeAnnouncements]);
    setTitle("");
    setContent("");
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          SaaS Announcements & Notices Broadcast
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Publish global notification bars, email maintenance alerts, or warn target user tiers of security/billing changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Creator panel */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4 text-left">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Draft New Notification Broadcast
          </span>

          <form onSubmit={handlePublish} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold">Target Audience</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="everyone">Everyone</option>
                  <option value="enterprise">Enterprise Plan Tier</option>
                  <option value="developer">Developer Plan Tier</option>
                  <option value="free">Free Tier Users Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold">Priority Warning Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="low">Low Info Alert</option>
                  <option value="medium">Medium Standard Alert</option>
                  <option value="high">High System Notice</option>
                  <option value="critical">Critical Downtime warning</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Announcement Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Postgres migration scheduling downtime warnings..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Notice Body Description</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explain the downtime details, estimated duration, and feature dependencies changes clearly..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-heading font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Publish Broadcast Announcement
            </button>
          </form>
        </div>

        {/* List of active logs */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4 text-left">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Active Broadcast Notices
          </span>
          <div className="space-y-3">
            {activeAnnouncements.map((notif) => (
              <div key={notif.id} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-semibold text-white leading-normal">{notif.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                    <span>Target: {notif.target}</span>
                    <span>•</span>
                    <span>Published {notif.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-[9.5px] uppercase font-bold ${
                    notif.priority === "high" || notif.priority === "critical" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                  }`}>
                    {notif.priority}
                  </Badge>
                  <button
                    onClick={() => setActiveAnnouncements(activeAnnouncements.filter((item) => item.id !== notif.id))}
                    className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminNotificationsPage;
