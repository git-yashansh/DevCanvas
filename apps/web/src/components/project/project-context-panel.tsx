import { useState } from "react";
import { Boxes, ShieldCheck, Zap, Layers, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@ui/index";
import type { Project } from "@types-pkg/index";
import { cn } from "@utils/index";

export function ProjectContextPanel({ project, overallScore }: { project: Project; overallScore: number }) {
  const [collapsed, setCollapsed] = useState(false);

  const generatedCount = [
    project.architecture,
    project.database_schema,
    project.api_spec,
    project.security_report,
    project.deployment_plan,
    project.documentation,
  ].filter(Boolean).length;

  return (
    <aside
      className={cn(
        "hidden xl:block shrink-0 transition-all duration-300 border-l border-white/10 bg-[#09090B]/90 backdrop-blur-xl text-left",
        collapsed ? "w-12 p-2" : "w-72 p-5 space-y-6"
      )}
    >
      <div className="flex items-center justify-between">
        {!collapsed && (
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-400">
            Project Context
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors mx-auto"
          title={collapsed ? "Expand Context Panel" : "Collapse Panel"}
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Project Details */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Project Name</span>
              <span className="font-heading text-sm font-bold text-white truncate block mt-0.5">{project.name}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Engineering Readiness</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-heading text-xl font-extrabold text-emerald-400">{overallScore}%</span>
                <Badge variant={overallScore >= 80 ? "success" : "warning"} className="text-[9px]">
                  {overallScore >= 80 ? "Production" : "In Progress"}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-neutral-500 block">Artifacts Generated</span>
              <span className="text-xs font-mono font-bold text-neutral-200 block mt-0.5">{generatedCount} of 6 Core Specs</span>
            </div>
          </div>

          <div className="h-px bg-white/10" />

          {/* Quick Artifacts Status */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">Specs Status</span>
            {[
              { label: "Architecture", ready: !!project.architecture },
              { label: "Database Schema", ready: !!project.database_schema },
              { label: "API Specification", ready: !!project.api_spec },
              { label: "Security Report", ready: !!project.security_report },
              { label: "Deployment Plan", ready: !!project.deployment_plan },
              { label: "Documentation", ready: !!project.documentation },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">{item.label}</span>
                <span className={cn("h-2 w-2 rounded-full", item.ready ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-neutral-700")} />
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10" />

          <div className="text-[10.5px] text-neutral-500 font-mono space-y-1">
            <div>Created: {new Date(project.created_at).toLocaleDateString()}</div>
            <div>Updated: {new Date(project.updated_at).toLocaleDateString()}</div>
          </div>
        </>
      )}
    </aside>
  );
}
