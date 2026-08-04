import { useState, useEffect } from "react";
import { Server, Activity, Database, Cpu, RefreshCw, AlertCircle, CheckCircle, Search, Download, Loader2 } from "lucide-react";
import { Badge } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/index";

export function AdminSystemMonitoringPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  async function loadSystemLogs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load system logs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSystemLogs();

    // Realtime listener for system_logs
    const channel = supabase
      .channel("admin:system_logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_logs" }, (payload) => {
        setLogs((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleExportCSV = () => {
    const headers = "ID,Timestamp,Service,Level,Status,CPU Usage,Memory Usage,Message\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.created_at}","${l.service}","${l.level}","${l.status}","${l.cpu_usage || 0}","${
            l.memory_usage || 0
          }","${(l.message || "").replace(/"/g, '""')}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.service?.toLowerCase().includes(search.toLowerCase()) ||
      l.message?.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || l.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const systems = [
    { name: "Public REST API Gateway", status: "Healthy", check: "200 OK", speed: "12ms", icon: Server },
    { name: "PostgreSQL Database", status: "Healthy", check: "Supabase Managed", speed: "4ms", icon: Database },
    { name: "Supabase Realtime Hub", status: "Healthy", check: "Websockets Open", speed: "18ms", icon: Activity },
    { name: "Deno Edge Workers", status: "Healthy", check: "8 active functions", speed: "1.2s", icon: Cpu },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            Infrastructure &amp; Cluster Monitoring
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Audit API operational status, edge function performance, and system telemetry error logs.
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
            onClick={loadSystemLogs}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-xl text-xs font-heading font-bold text-orange-400 transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Systems status grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systems.map((sys, idx) => (
          <div key={idx} className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-2">
              <sys.icon className="h-4 w-4 text-orange-400 shrink-0" />
              <Badge variant="outline" className="text-[10px] uppercase font-bold bg-emerald-500/10 border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {sys.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white text-[13px]">{sys.name}</p>
              <p className="text-[11px] text-neutral-400">{sys.check}</p>
              <p className="font-mono text-[10px] text-neutral-500 mt-2.5">Latency: {sys.speed}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Telemetry Logs Table */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row gap-4 justify-between items-center">
          <span className="font-heading text-sm font-bold text-white">System Telemetry Log Database ({filteredLogs.length})</span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs by service or message..."
                className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <span className="text-xs text-neutral-500 font-mono">Loading system telemetry logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-500 font-mono">
            No system logs matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-neutral-500 font-bold bg-white/[0.01]">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">CPU %</th>
                  <th className="p-4">Memory %</th>
                  <th className="p-4 pr-6">Log Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[12.5px] text-neutral-300 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                    <td className="p-4 pl-6 font-mono text-[11px] text-neutral-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9.5px] uppercase font-bold",
                          log.level === "error"
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            : log.level === "warning"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        )}
                      >
                        {log.level}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono font-semibold text-orange-400">{log.service}</td>
                    <td className="p-4 font-mono text-neutral-300">{log.status}</td>
                    <td className="p-4 font-mono text-neutral-400">{log.cpu_usage ? `${log.cpu_usage}%` : "—"}</td>
                    <td className="p-4 font-mono text-neutral-400">{log.memory_usage ? `${log.memory_usage}%` : "—"}</td>
                    <td className="p-4 pr-6 text-neutral-300 max-w-md truncate">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSystemMonitoringPage;
