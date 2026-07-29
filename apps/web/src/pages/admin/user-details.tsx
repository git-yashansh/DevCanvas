import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Settings,
  HardDrive,
  Cpu,
  Ticket,
  Clock,
  Shield,
  Activity,
  Award,
} from "lucide-react";
import { Badge } from "@ui/index";

export function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock user details based on ID
  const userObj = {
    id: id || "u1",
    name: "Yashansh",
    email: "kr.yashansh123@gmail.com",
    role: "admin",
    status: "active",
    plan: "Enterprise",
    projects: 12,
    storageUsed: "4.2GB",
    storageLimit: "50GB",
    joined: "2026-07-20",
    lastLogin: "3 minutes ago",
    sessions: [
      { ip: "192.168.1.14", device: "Chrome / Windows 11", time: "Just now (Active)" },
      { ip: "192.168.1.14", device: "Firefox / Windows 11", time: "2 hours ago" },
      { ip: "172.56.24.18", device: "Safari / iPhone 15", time: "1 day ago" },
    ],
    tokensUsed: "128,450",
    apiCalls: "4,821",
    tickets: [
      { id: "tk1", subject: "Postgres schema migration failure", priority: "critical", status: "resolved", created: "2026-07-21" },
      { id: "tk2", subject: "Vercel pipeline deployment fail", priority: "high", status: "open", created: "2026-07-24" },
    ],
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-5">
        <button
          onClick={() => navigate("/admin/users")}
          className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] text-neutral-450 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            User Operations Audit Profile
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Analyzing operational statistics, permissions clearances, session logs, and billing tiers for user {userObj.name}.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Profile info */}
        <div className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col items-center justify-center text-center p-3">
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shrink-0 mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-2xl font-black text-white uppercase border-2 border-[#0B0C0E]">
                {userObj.name.charAt(0)}
              </div>
            </div>
            <h2 className="font-heading text-lg font-bold text-white">{userObj.name}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{userObj.email}</p>
            <div className="flex gap-2.5 mt-3">
              <Badge variant="outline" className="text-[10px] uppercase font-bold bg-orange-500/10 border-orange-500/20 text-orange-400">{userObj.role}</Badge>
              <Badge variant="outline" className="text-[10px] uppercase font-bold bg-emerald-500/10 border-emerald-500/20 text-emerald-400">{userObj.status}</Badge>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/[0.08] pt-4 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Plan Tier:</span>
              <span className="font-semibold text-white">{userObj.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Joined Date:</span>
              <span className="font-semibold text-white">{userObj.joined}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Last Login:</span>
              <span className="font-semibold text-white">{userObj.lastLogin}</span>
            </div>
          </div>
        </div>

        {/* Resources Metrics & telemetry */}
        <div className="md:col-span-2 bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-5">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Resource Consumption Telemetries
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Storage Card */}
            <div className="bg-[#0B0C0E]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <HardDrive className="h-4 w-4 text-orange-400" />
                <span className="text-[10.5px] uppercase font-bold tracking-wider">Storage Used</span>
              </div>
              <p className="text-lg font-heading font-black text-white">{userObj.storageUsed}</p>
              <span className="text-[9.5px] text-neutral-500 block">Quota Limit: {userObj.storageLimit}</span>
            </div>

            {/* AI Call Card */}
            <div className="bg-[#0B0C0E]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <span className="text-[10.5px] uppercase font-bold tracking-wider">AI Calls</span>
              </div>
              <p className="text-lg font-heading font-black text-white">{userObj.apiCalls}</p>
              <span className="text-[9.5px] text-neutral-500 block">Tokens: {userObj.tokensUsed}</span>
            </div>

            {/* Tickets Card */}
            <div className="bg-[#0B0C0E]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Ticket className="h-4 w-4 text-cyan-400" />
                <span className="text-[10.5px] uppercase font-bold tracking-wider">Support Desk</span>
              </div>
              <p className="text-lg font-heading font-black text-white">{userObj.tickets.length}</p>
              <span className="text-[9.5px] text-neutral-500 block">1 active ticket open</span>
            </div>

          </div>

          {/* User Operations Control */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs gap-3">
            <span className="text-neutral-500">Administrative Actions:</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-all cursor-pointer">
                Suspend Account
              </button>
              <button className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-lg transition-all cursor-pointer">
                Reset Consumption
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Widescreen Columns: Session History and Support Tickets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Session history */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Active Sessions Log
          </span>
          <div className="space-y-3.5">
            {userObj.sessions.map((ses, i) => (
              <div key={i} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-mono text-white">{ses.ip}</p>
                  <p className="text-[10.5px] text-neutral-450">{ses.device}</p>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">{ses.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support tickets list */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Related Support Tickets
          </span>
          <div className="space-y-3.5">
            {userObj.tickets.map((tk, i) => (
              <div key={i} className="flex justify-between items-start text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-semibold text-white leading-normal">{tk.subject}</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-1">
                    <span>Created: {tk.created}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-[9.5px] bg-red-500/5 text-red-400 border-red-500/20 px-1 py-0">{tk.priority}</Badge>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                  tk.status === "resolved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                }`}>
                  {tk.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminUserDetailsPage;
