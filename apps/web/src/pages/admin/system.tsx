import { Server, Activity, Database, Cpu, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@ui/index";

export function AdminSystemMonitoringPage() {
  const systems = [
    { name: "Public REST API Gateway", status: "Healthy", check: "200 OK", speed: "12ms", icon: Server },
    { name: "Postgres Cluster Database", status: "Healthy", check: "Active connects: 14", speed: "4ms", icon: Database },
    { name: "Supabase Realtime Hub", status: "Healthy", check: "Websockets open", speed: "18ms", icon: Activity },
    { name: "Queue Message Workers", status: "Healthy", check: "Job rate: 12/min", speed: "0 active", icon: Cpu },
  ];

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            Infrastructure & Cluster Monitoring
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Audit API operational status, background worker queues, edge functions, and telemetry errors logs.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] rounded-xl text-xs font-heading font-bold text-white transition-all cursor-pointer">
          <RefreshCw className="h-4 w-4 text-orange-400" />
          Poll System Health
        </button>
      </div>

      {/* Systems grid */}
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
              <p className="text-[11px] text-neutral-500">{sys.check}</p>
              <p className="font-mono text-[10px] text-neutral-400 mt-2.5">Latency: {sys.speed}</p>
            </div>
          </div>
        ))}
      </div>

      {/* telemetries table and warnings log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Error warning alerts log */}
        <div className="lg:col-span-2 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Recent API Error Warn Log
          </span>
          <div className="space-y-3.5">
            {[
              { err: "JWT Verification signature expired", route: "GET /api/projects/u128", time: "12s ago" },
              { err: "Database pool exhausted, queued client request", route: "POST /api/chat/messages", time: "1m ago" },
              { err: "Gemini Pro prompt parsing timeout (gateway wait 10s limit)", route: "POST /api/generate-architecture", time: "42m ago" },
            ].map((e, idx) => (
              <div key={idx} className="text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0 space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-neutral-350 leading-normal">{e.err}</span>
                  <span className="text-[10px] text-neutral-500 font-mono shrink-0">{e.time}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-neutral-450">
                  <span className="font-mono text-orange-400">{e.route}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Worker statistics */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Background Queue Telemetries
          </span>
          <div className="space-y-4 text-xs text-left">
            {[
              { label: "Active Worker Threads", count: "4", percent: 40, color: "bg-orange-500" },
              { label: "Queued Job Payloads", count: "0", percent: 0, color: "bg-indigo-500" },
              { label: "Completed Jobs Today", count: "148", percent: 100, color: "bg-emerald-500" },
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-450">
                  <span>{stat.label}</span>
                  <span className="font-mono">{stat.count}</span>
                </div>
                <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                  <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminSystemMonitoringPage;
