import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  Server,
  AlertTriangle,
  Loader2,
  Users,
  Clock,
  Globe,
  Compass,
  Monitor,
  Download,
  Plus,
  Trash2,
  Shield,
  Search,
  UserX,
  X,
  Flame,
  CheckCircle,
} from "lucide-react";
import { Badge, Button } from "@ui/index";
import { supabase } from "@/lib/supabase";
import {
  useAdminBlockedIps,
  useAdminSecurityWarnings,
  useBlockIp,
  useUnblockIp,
  useActiveSessions,
  useTerminateSession,
  useTerminateAllSessions,
  useLoginHistory,
  useFailedAttempts,
  useAccountLockouts,
  useLockAccount,
  useUnlockAccount,
  useSystemRoles,
  useUpdateUserRole,
  useAdminUsers,
} from "@/services/admin/hooks";

type TabType = "dashboard" | "sessions" | "history" | "firewall" | "lockouts" | "roles";

// Segmented Shares Bar Component
function SegmentedBar({ data, nameKey, valKey }: { data: any[]; nameKey: string; valKey: string }) {
  const total = data.reduce((acc, d) => acc + d[valKey], 0) || 1;
  const COLORS = ["bg-rose-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500", "bg-cyan-500"];

  return (
    <div className="space-y-4">
      <div className="w-full h-3 rounded-full bg-neutral-900 flex overflow-hidden">
        {data.map((d, idx) => {
          const width = (d[valKey] / total) * 100;
          if (width === 0) return null;
          return (
            <div
              key={idx}
              className={COLORS[idx % COLORS.length]}
              style={{ width: `${width}%` }}
              title={`${d[nameKey]}: ${d[valKey]}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {data.map((d, idx) => {
          const share = Math.round((d[valKey] / total) * 100);
          const colorBg = COLORS[idx % COLORS.length];
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colorBg}`} />
              <span className="text-neutral-400 capitalize truncate">{d[nameKey]}</span>
              <span className="font-mono text-neutral-500 ml-auto">{d[valKey]} ({share}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom Failed Attempts Bar Chart
function FailedAttemptsChart({ attempts }: { attempts: any[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }).reverse();

  const dayCounts = days.map(day => {
    const count = attempts.filter(att => {
      const attDay = new Date(att.created_at).toLocaleDateString("en-US", { weekday: "short" });
      return attDay === day;
    }).length;
    return { day, count };
  });

  const maxVal = Math.max(...dayCounts.map(d => d.count), 1);
  const width = 500;
  const height = 130;
  const padding = 15;
  const barWidth = 35;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
        <span className="text-[10px] uppercase font-bold text-white tracking-wider flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500 animate-pulse" /> Failed Sign-In Trend (Last 7 Days)
        </span>
        <span className="text-[9.5px] font-mono text-neutral-500">Live Database Computed</span>
      </div>
      <div className="h-36 flex items-end justify-between px-2 bg-neutral-950/40 border border-white/5 rounded-xl p-3">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {dayCounts.map((d, idx) => {
            const x = padding + idx * ((width - 2 * padding) / dayCounts.length) + 12;
            const barHeight = (d.count * (height - 2 * padding)) / maxVal;
            const y = height - padding - barHeight;
            return (
              <g key={idx}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#ef4444"
                  rx={2}
                  className="opacity-70 hover:opacity-100 transition-opacity"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 2}
                  textAnchor="middle"
                  fill="#737373"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {d.day}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  fill="#a3a3a3"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {d.count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Block IP Form state
  const [ipInput, setIpInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [expiryInput, setExpiryInput] = useState("");
  const [notesInput, setNotesInput] = useState("");

  // Lock Account Form state
  const [lockUserId, setLockUserId] = useState("");
  const [lockDuration, setLockDuration] = useState("15");
  const [lockReason, setLockReason] = useState("");

  // React Query Hooks
  const { data: blockedIps = [], isLoading: loadIps, refetch: refetchIps } = useAdminBlockedIps();
  const { data: alerts = [], isLoading: loadAlerts, refetch: refetchAlerts } = useAdminSecurityWarnings();
  const { data: sessions = [], isLoading: loadSessions, refetch: refetchSessions } = useActiveSessions();
  const { data: logins = [], isLoading: loadLogins, refetch: refetchLogins } = useLoginHistory();
  const { data: failedLogins = [], isLoading: loadFailed, refetch: refetchFailed } = useFailedAttempts();
  const { data: lockouts = [], isLoading: loadLocks, refetch: refetchLocks } = useAccountLockouts();
  const { data: systemRoles = [], isLoading: loadRoles } = useSystemRoles();
  const { data: users = [], isLoading: loadUsers } = useAdminUsers();

  // Mutations
  const { mutateAsync: blockIp } = useBlockIp();
  const { mutateAsync: unblockIp } = useUnblockIp();
  const { mutateAsync: terminateSession } = useTerminateSession();
  const { mutateAsync: terminateAllSessions } = useTerminateAllSessions();
  const { mutateAsync: lockAccount } = useLockAccount();
  const { mutateAsync: unlockAccount } = useUnlockAccount();
  const { mutateAsync: updateUserRole } = useUpdateUserRole();

  // Realtime refetch triggers on pg channel changes
  useEffect(() => {
    const blockedChan = supabase.channel("realtime:blocked_ips").on("postgres_changes", { event: "*", schema: "public", table: "blocked_ips" }, () => refetchIps()).subscribe();
    const alertsChan = supabase.channel("realtime:security_alerts").on("postgres_changes", { event: "*", schema: "public", table: "security_alerts" }, () => refetchAlerts()).subscribe();
    const sessionsChan = supabase.channel("realtime:active_sessions").on("postgres_changes", { event: "*", schema: "public", table: "active_sessions" }, () => refetchSessions()).subscribe();
    const loginsChan = supabase.channel("realtime:login_history").on("postgres_changes", { event: "*", schema: "public", table: "login_history" }, () => refetchLogins()).subscribe();
    const failedChan = supabase.channel("realtime:failed_login_attempts").on("postgres_changes", { event: "*", schema: "public", table: "failed_login_attempts" }, () => refetchFailed()).subscribe();
    const locksChan = supabase.channel("realtime:account_lockouts").on("postgres_changes", { event: "*", schema: "public", table: "account_lockouts" }, () => refetchLocks()).subscribe();

    return () => {
      supabase.removeChannel(blockedChan);
      supabase.removeChannel(alertsChan);
      supabase.removeChannel(sessionsChan);
      supabase.removeChannel(loginsChan);
      supabase.removeChannel(failedChan);
      supabase.removeChannel(locksChan);
    };
  }, [refetchIps, refetchAlerts, refetchSessions, refetchLogins, refetchFailed, refetchLocks]);

  const handleRefreshAll = () => {
    refetchIps();
    refetchAlerts();
    refetchSessions();
    refetchLogins();
    refetchFailed();
    refetchLocks();
  };

  const handleBlockIpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput || !reasonInput) return;
    try {
      await blockIp({
        ip: ipInput,
        reason: reasonInput,
        blockedBy: "admin_console",
        expiry: isPermanent ? null : expiryInput || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        permanent: isPermanent,
        notes: notesInput || null
      });
      setIpInput("");
      setReasonInput("");
      setNotesInput("");
      alert("IP block added successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to block IP.");
    }
  };

  const handleLockAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockUserId || !lockReason) return;
    try {
      await lockAccount({
        userId: lockUserId,
        durationMinutes: parseInt(lockDuration, 10),
        reason: lockReason
      });
      setLockUserId("");
      setLockReason("");
      alert("User account locked out successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to lock account.");
    }
  };

  const handleExportData = () => {
    let content = "";
    let name = `security_${activeTab}`;
    if (activeTab === "firewall") {
      content = "IP,Reason,Blocked By,Blocked Time,Expiry\n" +
        blockedIps.map(b => `${b.ip},"${b.reason}",${b.blocked_by},${b.blocked_time},${b.expiry || "Permanent"}`).join("\n");
    } else if (activeTab === "history") {
      content = "User Email,Username,IP Address,Country,Browser,OS,Login Time\n" +
        logins.map(l => `${l.email},${l.username || "n/a"},${l.ip_address},${l.country},${l.browser},${l.operating_system},${l.login_time}`).join("\n");
    } else {
      content = "Active Session ID,User ID,Device,Browser,OS,IP,Status\n" +
        sessions.map(s => `${s.session_id},${s.user_id},${s.device},${s.browser},${s.os},${s.ip_address},${s.status}`).join("\n");
    }
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = loadIps || loadAlerts || loadSessions || loadLogins || loadFailed || loadLocks || loadRoles || loadUsers;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-neutral-400">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="text-xs font-mono">Connecting to live security firewall...</span>
      </div>
    );
  }

  // Segment allocations for dashboard metrics
  const activeSessionsCount = sessions.filter(s => s.status === "active").length;
  const adminSessionsCount = sessions.filter(s => {
    const prof = users.find(u => u.id === s.user_id);
    return prof?.role === "admin" && s.status === "active";
  }).length;
  const lockoutsCount = lockouts.length;
  const failedattemptsToday = failedLogins.filter(f => new Date(f.created_at).getTime() >= Date.now() - 24 * 60 * 60 * 1000).length;

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-orange-500" /> Enterprise Security Center
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Lock network IP gateways, terminate active sessions, configure roles, and audit security events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "dashboard" && activeTab !== "roles" && (
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-xl text-xs font-heading font-bold text-neutral-300 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-xs font-heading font-bold text-orange-400 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Refresh center
          </button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active online Sessions", val: activeSessionsCount.toString(), change: `${adminSessionsCount} administrators online`, color: "text-emerald-400" },
          { label: "Blocked IP Rules", val: blockedIps.length.toString(), change: "Firewall enabled", color: "text-rose-400" },
          { label: "Failed attempts (24h)", val: failedattemptsToday.toString(), change: "Suspicious brute attempts", color: "text-amber-400" },
          { label: "Locked Accounts", val: lockoutsCount.toString(), change: "Brute protections", color: "text-indigo-400" },
        ].map((item, idx) => (
          <div key={idx} className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{item.label}</span>
            <div className="mt-3">
              <span className="text-xl font-heading font-black text-white block">{item.val}</span>
              <span className="text-[9.5px] font-semibold text-neutral-450 mt-0.5 block">{item.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/10 gap-4 overflow-x-auto pb-px">
        {[
          { id: "dashboard", label: "Overview Dashboard" },
          { id: "sessions", label: "Active Sessions" },
          { id: "history", label: "Login History" },
          { id: "firewall", label: "IP Blocklist" },
          { id: "lockouts", label: "Lockouts & Locks" },
          { id: "roles", label: "Role & Permission" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabType)}
            className={`pb-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? "border-orange-500 text-white font-extrabold"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Trend chart failed log */}
          <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <FailedAttemptsChart attempts={failedLogins} />
          </div>

          {/* Warning security alerts list */}
          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
                Recent Security Warnings
              </span>
              {alerts.length === 0 ? (
                <p className="text-xs text-neutral-500 py-12 text-center font-mono">No security warnings logged.</p>
              ) : (
                <div className="space-y-4 mt-3">
                  {alerts.slice(0, 3).map((a) => (
                    <div key={a.id} className="text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-white flex items-center gap-1.5 capitalize">
                          <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                          {a.alert_type.replace("_", " ")}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">Risk: {a.risk_score}</span>
                      </div>
                      <p className="text-[10.5px] text-neutral-400 font-sans mt-1 leading-relaxed">{a.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "sessions" && (
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
            <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Live Logged-In User Sessions</span>
            {sessions.filter(s => s.status === "active").length > 0 && (
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to terminate all active sessions? All users will be forced to logout.")) {
                    await terminateAllSessions();
                    alert("All user sessions terminated.");
                  }
                }}
                className="px-3 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer uppercase"
              >
                Terminate All Sessions
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10.5px] uppercase tracking-wider text-neutral-500 font-bold bg-white/[0.01]">
                  <th className="p-3 pl-4">User</th>
                  <th className="p-3">Session IP / Country</th>
                  <th className="p-3">Browser / OS</th>
                  <th className="p-3">Session Start</th>
                  <th className="p-3">Last Activity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[12.5px] text-neutral-300">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-neutral-500 font-mono text-xs">No active sessions found.</td>
                  </tr>
                ) : (
                  sessions.map((s) => {
                    const prof = s.profiles;
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.01]">
                        <td className="p-3 pl-4">
                          <p className="font-semibold text-white">{prof?.full_name || "User"}</p>
                          <p className="text-[10px] text-neutral-500">{prof?.email || "n/a"}</p>
                        </td>
                        <td className="p-3 font-mono">
                          {s.ip_address} <span className="text-neutral-500 ml-1">({s.country || "n/a"})</span>
                        </td>
                        <td className="p-3">
                          {s.browser} <span className="text-neutral-500 ml-1">on {s.os}</span>
                        </td>
                        <td className="p-3 text-neutral-400 font-mono text-[11px]">
                          {new Date(s.created_at).toLocaleString()}
                        </td>
                        <td className="p-3 text-neutral-400 font-mono text-[11px]">
                          {new Date(s.last_activity).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                            s.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                          }`}>
                            {s.status}
                          </Badge>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          {s.status === "active" && (
                            <button
                              onClick={async () => {
                                if (confirm("Terminate this session?")) {
                                  await terminateSession(s.session_id);
                                }
                              }}
                              className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              TERMINATE
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-3">
            <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">Login History Logs</span>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-white/10 bg-white/[0.02] pl-8 pr-3 text-xs text-white outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10.5px] uppercase tracking-wider text-neutral-500 font-bold bg-white/[0.01]">
                  <th className="p-3 pl-4">Email</th>
                  <th className="p-3">User IP Address</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Browser / OS</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Login Time</th>
                  <th className="p-3 pr-4">Logout Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[12.5px] text-neutral-300">
                {logins
                  .filter(l => l.email.toLowerCase().includes(searchQuery.toLowerCase()))
                  .length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-neutral-500 font-mono text-xs">No login history recorded.</td>
                  </tr>
                ) : (
                  logins
                    .filter(l => l.email.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((l) => (
                      <tr key={l.id} className="hover:bg-white/[0.01]">
                        <td className="p-3 pl-4">
                          <p className="font-semibold text-white">{l.email}</p>
                          <p className="text-[10px] text-neutral-500">{l.username}</p>
                        </td>
                        <td className="p-3 font-mono text-neutral-300">{l.ip_address}</td>
                        <td className="p-3">{l.city}, {l.country}</td>
                        <td className="p-3">
                          {l.browser} <span className="text-neutral-500">on {l.operating_system}</span>
                        </td>
                        <td className="p-3 capitalize">{l.device_type}</td>
                        <td className="p-3 font-mono text-[11px] text-neutral-400">
                          {new Date(l.login_time).toLocaleString()}
                        </td>
                        <td className="p-3 pr-4 font-mono text-[11px] text-neutral-400">
                          {l.logout_time ? new Date(l.logout_time).toLocaleString() : "Active session"}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "firewall" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* IP blocklist database */}
          <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
              Active Locked IP Database
            </span>
            <div className="space-y-3">
              {blockedIps.length === 0 ? (
                <p className="text-xs text-neutral-500 py-12 text-center font-mono">No IP blocks active.</p>
              ) : (
                blockedIps.map((b) => (
                  <div key={b.id} className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-white">{b.ip}</p>
                      <p className="text-neutral-400 text-[11px]">{b.reason}</p>
                      <p className="text-[10px] text-neutral-500">Blocked on: {new Date(b.blocked_time).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (confirm(`Unlock IP ${b.ip}?`)) {
                            await unblockIp(b.ip);
                          }
                        }}
                        className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 text-[10px] font-bold transition-all cursor-pointer font-mono"
                      >
                        UNLOCK
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add block rule form */}
          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
              Add Block rule
            </span>
            <form onSubmit={handleBlockIpSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Target IP Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.1"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Reason for blocking</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brute force attempts"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perm"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                />
                <label htmlFor="perm" className="text-[11px] font-bold text-neutral-350">Permanent Block</label>
              </div>

              {!isPermanent && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-neutral-400">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={expiryInput}
                    onChange={(e) => setExpiryInput(e.target.value)}
                    className="w-full h-8 px-2 bg-neutral-900 border border-white/10 rounded-lg text-white outline-none focus:border-orange-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Notes</label>
                <textarea
                  placeholder="Optional admin description..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full h-16 p-2 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 outline-none focus:border-orange-500 text-xs"
                />
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold h-8 text-xs cursor-pointer">
                Add IP Block
              </Button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "lockouts" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Active lockout table */}
          <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
              Active locked user profiles
            </span>
            <div className="space-y-3">
              {lockouts.length === 0 ? (
                <p className="text-xs text-neutral-500 py-12 text-center font-mono">No accounts currently locked.</p>
              ) : (
                lockouts.map((l) => {
                  const prof = l.profiles;
                  return (
                    <div key={l.id} className="flex justify-between items-center text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-white">{prof?.full_name || "User"}</p>
                        <p className="text-[10.5px] text-neutral-500">{prof?.email || "n/a"}</p>
                        <p className="text-[11px] text-red-400 mt-1">Reason: {l.reason}</p>
                        <p className="text-[9.5px] text-neutral-500">Locked until: {new Date(l.unlock_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Unlock account for ${prof?.full_name || "user"}?`)) {
                            await unlockAccount(l.user_id);
                            alert("Account unlocked.");
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold transition-all cursor-pointer font-mono"
                      >
                        UNLOCK PROFILE
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Lock Account form */}
          <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
              Lock User profile
            </span>
            <form onSubmit={handleLockAccountSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Select User Account</label>
                <select
                  required
                  value={lockUserId}
                  onChange={(e) => setLockUserId(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-white/10 rounded-lg text-white outline-none focus:border-orange-500 text-xs"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Duration (Minutes)</label>
                <select
                  value={lockDuration}
                  onChange={(e) => setLockDuration(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-white/10 rounded-lg text-white outline-none focus:border-orange-500 text-xs"
                >
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="1440">24 Hours</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-neutral-400">Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suspected credential abuse"
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="w-full h-8 px-2 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder:text-neutral-600 outline-none focus:border-orange-500"
                />
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold h-8 text-xs cursor-pointer">
                Lock Account
              </Button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* Roles definitions table */}
          <div className="lg:col-span-7 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
              System Privilege mappings
            </span>
            <div className="space-y-3">
              {systemRoles.map((role) => (
                <div key={role.id} className="text-xs border-b border-white/[0.02] pb-3.5 last:border-b-0 last:pb-0 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-[13px] capitalize">{role.name}</span>
                    <Badge variant="outline" className="text-[9.5px] font-mono">Priority: {role.priority}</Badge>
                  </div>
                  <p className="text-neutral-400 text-[11px] font-sans">{role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {role.permissions.map((p, i) => (
                      <Badge key={i} className="text-[9px] bg-neutral-900 border-white/5 text-neutral-500 font-mono font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User promotion/demotion assignment panel */}
          <div className="lg:col-span-5 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-xs font-bold text-white block border-b border-white/[0.08] pb-3 uppercase tracking-wider">
              Change User Privilege Level
            </span>
            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.id} className="flex justify-between items-center text-xs p-2.5 rounded bg-white/[0.01] border border-white/5">
                  <div className="truncate">
                    <p className="font-semibold text-white truncate">{u.full_name || "User"}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={async (e) => {
                      const newRole = e.target.value;
                      if (confirm(`Change role of ${u.full_name || "user"} to ${newRole}?`)) {
                        await updateUserRole({ userId: u.id, role: newRole });
                        alert("Role updated successfully.");
                      }
                    }}
                    className="h-7 bg-neutral-900 border border-white/10 rounded-lg text-white font-mono text-[10px] px-1 outline-none"
                  >
                    <option value="owner">Owner</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="support">Support</option>
                    <option value="developer">Developer</option>
                    <option value="premium">Premium</option>
                    <option value="user">User</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSecurityPage;
