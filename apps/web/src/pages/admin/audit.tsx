import { useState } from "react";
import { Search, Loader2, Download, ClipboardList, RefreshCw } from "lucide-react";
import { Badge } from "@ui/index";
import { cn } from "@utils/index";
import { useAdminAuditLogs } from "@/services/admin/hooks";

export function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const { data: logs = [], isLoading: loading, refetch } = useAdminAuditLogs();

  const handleExportCSV = () => {
    const headers = "ID,Timestamp,Actor,Action,Entity,Result,IP Address,Details\n";
    const rows = logs
      .map((log) => {
        const actorObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
        const actor = actorObj?.email || "System Operator";
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "";
        return `"${log.id}","${log.created_at}","${actor}","${log.action}","${log.entity}","${log.result}","${
          log.ip_address || ""
        }","${details}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter((log) => {
    const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    const matchesSearch =
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesResult = resultFilter === "all" || log.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
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
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] rounded-xl text-xs font-heading font-bold text-white transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 text-orange-400" />
            Export CSV
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-xs font-heading font-bold text-orange-400 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-heading text-sm font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-orange-400" /> Security Audit Log Database ({filteredLogs.length})
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by action, admin, or target..."
                className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">All Results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
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
              <tbody className="divide-y divide-white/[0.04] text-[13px] text-neutral-300">
                {filteredLogs.map((log) => {
                  const profileObj = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6 font-mono text-[12px] text-neutral-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 leading-snug">
                        <p className="font-semibold text-white">{profileObj?.full_name || "Operator"}</p>
                        <p className="text-[10.5px] text-neutral-400 font-mono">{profileObj?.email || "n/a"}</p>
                      </td>
                      <td className="p-4 font-semibold text-white">{log.action}</td>
                      <td className="p-4 font-mono text-[12px] text-neutral-300">{log.entity}</td>
                      <td className="p-4 max-w-[200px] truncate font-mono text-[11px] text-neutral-400">
                        {log.details ? JSON.stringify(log.details) : "-"}
                      </td>
                      <td className="p-4 font-mono text-[12px] text-neutral-400">{log.ip_address || "n/a"}</td>
                      <td className="p-4 pr-6 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            log.result === "success"
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          )}
                        >
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
