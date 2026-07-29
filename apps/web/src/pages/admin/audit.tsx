import { useState, useEffect } from "react";
import { Search, Loader2, Download, ClipboardList } from "lucide-react";
import { Badge } from "@ui/index";
import { supabase } from "@/lib/supabase";

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadLogs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          created_at,
          action,
          entity,
          details,
          ip_address,
          user_agent,
          result,
          profiles:actor_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    return (
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            Operations Audit Log Database
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Complete historical audit tracking of mutations, administrator privilege actions, security locks, and config adjustments.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] rounded-xl text-xs font-heading font-bold text-white transition-all cursor-pointer"
        >
          Refresh Security Log
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <span className="font-heading text-sm font-bold text-white flex items-center gap-2"><ClipboardList className="h-4 w-4 text-orange-400" /> Security Logs Log</span>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, admin, or target..."
              className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.06]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <span className="text-xs text-neutral-500 font-mono">Loading security audits...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-500 font-mono">
            No audit logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-neutral-500 font-bold bg-white/[0.01]">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Admin Operator</th>
                  <th className="p-4">Action Event</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4 pr-6 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[13px] text-neutral-300 font-sans">
                {filteredLogs.map((log) => {
                  const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                  
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6 font-mono text-[12px] text-neutral-450">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 leading-snug">
                        <p className="font-semibold text-white">{profileObj?.full_name || "Operator"}</p>
                        <p className="text-[10.5px] text-neutral-500">{profileObj?.email || "n/a"}</p>
                      </td>
                      <td className="p-4 text-neutral-200">{log.action}</td>
                      <td className="p-4 font-mono text-[12px] text-neutral-400">{log.entity}</td>
                      <td className="p-4 max-w-[200px] truncate font-mono text-[11px] text-neutral-450">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </td>
                      <td className="p-4 font-mono text-[12px]">{log.ip_address || "n/a"}</td>
                      <td className="p-4 pr-6 text-right">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase ${
                          log.result === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {log.result}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
export default AdminAuditLogsPage;
