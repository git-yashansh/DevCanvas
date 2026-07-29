import { BarChart3, TrendingUp, Users, Clock, Globe, Compass, Monitor } from "lucide-react";

export function AdminAnalyticsPage() {
  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          SaaS Conversion & Retention Analytics
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Monitor user onboarding funnels, session durations, regional geographics, and device hardware telemetry.
        </p>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Monthly Active Users", val: "2,842", change: "+14.2% vs prev month", color: "text-orange-400" },
          { label: "Daily Active Users", val: "342", change: "12.03% conversion ratio", color: "text-indigo-400" },
          { label: "Avg. Session Duration", val: "18m 42s", change: "+2m 14s vs avg", color: "text-emerald-400" },
          { label: "7-Day Retention", val: "68.2%", change: "+1.2% this week", color: "text-cyan-400" },
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

      {/* Analytical Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Retention Line Chart */}
        <div className="lg:col-span-2 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
            <span className="font-heading text-[15px] font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-orange-400 animate-pulse" /> Weekly User Onboarding Trend
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">Last 30 Days</span>
          </div>

          <div className="h-44 flex items-end">
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <path
                d="M 0 140 Q 80 90, 160 110 T 320 50 T 480 30 L 500 35"
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
              />
              <path
                d="M 0 140 Q 80 90, 160 110 T 320 50 T 480 30 L 500 35 L 500 150 L 0 150 Z"
                fill="rgba(99,102,241,0.04)"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>

        {/* Breakdown parameters */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Device & Browser Telemetry
          </span>
          <div className="space-y-4 text-xs text-left">
            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5 text-orange-400" /> Desktop (Windows/macOS)</span>
                <span className="font-mono">72.4%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "72.4%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1.5"><Compass className="h-3.5 w-3.5 text-indigo-400" /> Web Browsers (Chrome/Safari)</span>
                <span className="font-mono">88.9%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "88.9%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-emerald-400" /> International Traffic</span>
                <span className="font-mono">42%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "42%" }} />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
export default AdminAnalyticsPage;
