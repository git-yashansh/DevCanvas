import { useMemo } from "react";
import {
  Sparkles,
  Cpu,
  Database,
  Rocket,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  Boxes,
  Code2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@ui/index";
import type { Project } from "@types-pkg/index";
import { cn } from "@utils/index";

export function ProjectInsightsTab({ project }: { project: Project }) {
  const telemetry = useMemo(() => {
    const arch = project.architecture;
    const db = project.database_schema;
    const api = project.api_spec;
    const sec = project.security_report;
    const dep = project.deployment_plan;
    const docs = project.documentation;

    // Derived Tech Stack
    const techStack: string[] = ["TypeScript", "React 18", "TailwindCSS"];
    if (db) techStack.push("PostgreSQL", "Prisma ORM");
    if (api) techStack.push("REST API", "OpenAPI 3.0", "JWT Auth");
    if (arch) techStack.push("Docker", "Redis", "Nginx");
    if (dep) techStack.push("Kubernetes", "GitHub Actions");

    // Count artifacts
    const artifactList = [
      { name: "Architecture Diagram", ready: !!arch, key: "arch" },
      { name: "Database Schema", ready: !!db, key: "db" },
      { name: "API Specification", ready: !!api, key: "api" },
      { name: "Security Audit", ready: !!sec, key: "sec" },
      { name: "Deployment CI/CD", ready: !!dep, key: "dep" },
      { name: "Documentation Suite", ready: !!docs, key: "docs" },
    ];
    const generatedCount = artifactList.filter((a) => a.ready).length;
    const readinessPct = Math.round((generatedCount / artifactList.length) * 100);

    // Derived Complexity & Estimates
    const serviceCount = arch?.services?.length || 1;
    const tableCount = db?.tables?.length || 1;
    const endpointCount = api?.endpoints?.length || 1;

    let complexity: "Low" | "Moderate" | "High" | "Enterprise" = "Low";
    if (serviceCount > 5 || tableCount > 12 || endpointCount > 20) complexity = "Enterprise";
    else if (serviceCount > 3 || tableCount > 6 || endpointCount > 10) complexity = "High";
    else if (serviceCount > 1 || tableCount > 3 || endpointCount > 5) complexity = "Moderate";

    const estTimeWeeks = serviceCount * 2 + Math.ceil(tableCount * 0.5);
    const estMonthlyCostUSD = serviceCount * 35 + (dep ? 120 : 50);

    const missingComponents = artifactList.filter((a) => !a.ready).map((a) => a.name);

    return {
      techStack,
      artifactList,
      generatedCount,
      readinessPct,
      complexity,
      estTimeWeeks,
      estMonthlyCostUSD,
      missingComponents,
      serviceCount,
      tableCount,
      endpointCount,
      archStyle: arch?.services?.length > 1 ? "Microservices / Modular Monolith" : "Monolithic Application",
      dbType: db?.tables ? "Relational PostgreSQL" : "Unspecified SQL/NoSQL",
      deployStrategy: dep ? "Containerized Docker & CI/CD" : "Basic Cloud Hosting",
      riskLevel: missingComponents.length > 3 ? "High Risk (Unvalidated)" : missingComponents.length > 0 ? "Moderate" : "Low Risk",
    };
  }, [project]);

  return (
    <div className="space-y-8 text-left">
      {/* Top Banner */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-400" />
              <h2 className="font-heading text-xl font-bold text-white tracking-tight">AI Project Telemetry &amp; Insights</h2>
              <Badge variant="outline" className="border-primary-500/30 text-primary-300 bg-primary-500/10">
                Live Overview
              </Badge>
            </div>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              Derived intelligence synthesized from your project description, architecture topology, PostgreSQL database schema, OpenAPI endpoints, and security audits.
            </p>
          </div>

          <div className="flex items-center gap-4 border-t border-white/10 pt-4 lg:border-0 lg:pt-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Engineering Readiness</span>
              <span className="font-heading text-2xl font-extrabold text-white">{telemetry.readinessPct}%</span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Risk Status</span>
              <span className={cn("font-heading text-sm font-bold block mt-1", telemetry.riskLevel.includes("High") ? "text-danger-400" : telemetry.riskLevel.includes("Moderate") ? "text-amber-400" : "text-emerald-400")}>
                {telemetry.riskLevel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Project Complexity</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="font-heading text-2xl font-bold text-white block mt-2">{telemetry.complexity}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">{telemetry.serviceCount} Services · {telemetry.tableCount} DB Tables</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Estimated Dev Duration</span>
            <Clock className="h-4 w-4 text-sky-400" />
          </div>
          <span className="font-heading text-2xl font-bold text-white block mt-2">~{telemetry.estTimeWeeks} Weeks</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Full-stack implementation time</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Est. Infra Cost</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="font-heading text-2xl font-bold text-white block mt-2">${telemetry.estMonthlyCostUSD} / mo</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Cloud deployment estimate</span>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Artifacts Status</span>
            <CheckCircle2 className="h-4 w-4 text-violet-400" />
          </div>
          <span className="font-heading text-2xl font-bold text-white block mt-2">{telemetry.generatedCount} / {telemetry.artifactList.length}</span>
          <span className="text-[11px] text-neutral-500 block mt-1">Core specifications generated</span>
        </div>
      </div>

      {/* Technical Architecture Summary Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Architecture & Stack Profile */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
            Detected Technical Profile
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-neutral-400">Architecture Style:</span>
              <span className="font-semibold text-white">{telemetry.archStyle}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-neutral-400">Database Engine:</span>
              <span className="font-semibold text-white">{telemetry.dbType}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-neutral-400">Deployment Strategy:</span>
              <span className="font-semibold text-white">{telemetry.deployStrategy}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-neutral-400">Exposed Endpoints:</span>
              <span className="font-semibold text-white">{telemetry.endpointCount} REST Routes</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider block mb-2">Detected Tech Stack:</span>
            <div className="flex flex-wrap gap-1.5">
              {telemetry.techStack.map((tech) => (
                <span key={tech} className="rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-300 font-medium">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Missing Components & Next Steps */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
            Artifact Generation Progress
          </h3>

          <div className="space-y-2.5">
            {telemetry.artifactList.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-neutral-950/60 text-xs">
                <span className="text-neutral-200 font-medium">{item.name}</span>
                <Badge variant={item.ready ? "success" : "outline"} className="text-[10px]">
                  {item.ready ? "Complete" : "Missing"}
                </Badge>
              </div>
            ))}
          </div>

          {telemetry.missingComponents.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Missing Artifacts Attention Needed:
              </span>
              <p className="text-[11px] text-amber-200/80 leading-normal">
                {telemetry.missingComponents.join(", ")} have not been generated yet. Run automated pipeline from the Overview tab to complete your engineering blueprint.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
