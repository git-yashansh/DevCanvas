import { useState } from "react";
import { ShieldCheck, ShieldAlert, Lock, Unlock, Eye, RefreshCw, Server, AlertTriangle } from "lucide-react";
import { Badge } from "@ui/index";

export function AdminSecurityPage() {
  const [blockedIps, setBlockedIps] = useState([
    { ip: "45.12.82.14", reason: "Excessive failed API auth requests", date: "Jul 28, 2026" },
    { ip: "182.42.148.9", reason: "Brute-force password guessing attempts", date: "Jul 29, 2026" },
  ]);

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            Security Control & IP Firewalls
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review failed login notifications, monitor active rate-limiting triggers, inspect JWT validation flags, and lock IP nodes.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] rounded-xl text-xs font-heading font-bold text-white transition-all cursor-pointer">
          <RefreshCw className="h-4 w-4 text-orange-400" />
          Poll Security Logs
        </button>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Blocked IP Ranges", val: blockedIps.length.toString(), change: "2 locked subnets", color: "text-red-400" },
          { label: "Failed Logins (24h)", val: "42 attempts", change: "Locked accounts: 0", color: "text-amber-400" },
          { label: "Rate Limit Blocks Today", val: "148 blocks", change: "analyze-security trigger", color: "text-indigo-400" },
          { label: "Active JWT Tokens", val: "348 validated", change: "Avg expiry: 1 hour", color: "text-emerald-400" },
        ].map((item, idx) => (
          <div key={idx} className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{item.label}</span>
            <div className="mt-3">
              <span className="text-xl font-heading font-black text-white block">{item.val}</span>
              <span className="text-[9.5px] font-semibold text-neutral-450 mt-0.5 block">{item.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Blocked IPs & Recent alerts split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Blocked IP Table */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4 text-left">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Active Locked IP Database
          </span>
          <div className="space-y-3">
            {blockedIps.map((b, i) => (
              <div key={i} className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-mono text-white">{b.ip}</p>
                  <p className="text-[10.5px] text-neutral-450">{b.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-500 font-mono mr-2">{b.date}</span>
                  <button
                    onClick={() => setBlockedIps(blockedIps.filter((item) => item.ip !== b.ip))}
                    className="p-1 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer text-[10px] font-bold font-mono"
                  >
                    UNLOCK
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suspicious alerts log */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4 text-left">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Recent Security Warning Logs
          </span>
          <div className="space-y-3.5">
            {[
              { title: "Brute-force login warning", msg: "14 failed credentials attempts on kr.yashansh123@gmail.com", time: "14m ago" },
              { title: "JWT token validation exception", msg: "Incoming request carried an invalid secret key signature", time: "1 hour ago" },
              { title: "IP address change detected", msg: "Admin session ip updated from 192.168.1.14 to 172.56.24.12", time: "2 hours ago" },
            ].map((warn, i) => (
              <div key={i} className="text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0 space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-white flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-orange-400" /> {warn.title}</span>
                  <span className="text-[10px] text-neutral-500 font-mono shrink-0">{warn.time}</span>
                </div>
                <p className="text-[10.5px] text-neutral-450 leading-relaxed font-sans">{warn.msg}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminSecurityPage;
