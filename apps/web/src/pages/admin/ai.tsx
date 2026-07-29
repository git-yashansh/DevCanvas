import { Cpu, Zap, Activity, HardDrive, DollarSign, Award, Info } from "lucide-react";
import { Badge } from "@ui/index";

export function AdminAiOperationsPage() {
  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          AI Model Operations Telemetry
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Monitor token counts, average response latencies, estimated provider API costs, and feature request success metrics.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "AI Prompts Today", val: "4,821", change: "+14.2% vs avg", color: "text-orange-400" },
          { label: "Avg. Latency Time", val: "1.82s", change: "-0.12s optimization", color: "text-indigo-400" },
          { label: "Tokens Dispatched", val: "12.8M", change: "Input/Output split", color: "text-emerald-400" },
          { label: "Gemini API Cost Today", val: "$14.22", change: "Based on token rates", color: "text-cyan-400" },
          { label: "Successful Requests", val: "99.76%", change: "12 failures flagged", color: "text-amber-400" },
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

      {/* AI Features Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Usage Breakdown by Feature */}
        <div className="lg:col-span-2 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            AI Operations Feature Distribution
          </span>
          <div className="space-y-3.5 text-xs text-left">
            {[
              { name: "Architecture Diagram Generation", count: "2,142 prompts", percent: 45, color: "bg-orange-500" },
              { name: "Database Schema Auto-Designer", count: "1,248 prompts", percent: 26, color: "bg-indigo-500" },
              { name: "API Blueprint Generator", count: "821 prompts", percent: 17, color: "bg-emerald-500" },
              { name: "SaaS Documentation Generation", count: "610 prompts", percent: 12, color: "bg-cyan-500" },
            ].map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-400">
                  <span>{f.name}</span>
                  <span className="font-mono text-neutral-350">{f.count} ({f.percent}%)</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Failed AI Requests Inspector */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4 text-left">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Recent AI Failure Warnings
          </span>
          <div className="space-y-3.5">
            {[
              { err: "API quota limits hit on backup key", service: "Database Designer", time: "14m ago" },
              { err: "JSON decode parse errors in schema payload", service: "Architecture Gen", time: "42m ago" },
              { err: "Model context window size overflow (8k tokens)", service: "Documentation Gen", time: "2h ago" },
            ].map((err, i) => (
              <div key={i} className="text-xs border-b border-white/[0.02] pb-3 last:border-b-0 last:pb-0 space-y-1">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-red-400 leading-normal">{err.err}</span>
                  <span className="text-[10px] text-neutral-500 font-mono shrink-0">{err.time}</span>
                </div>
                <span className="text-[10px] text-neutral-400 uppercase font-mono block">Component: {err.service}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminAiOperationsPage;
