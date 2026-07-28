import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Download,
  Boxes,
  Database,
  Code2,
  Rocket,
  FileText,
  GitBranch,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Badge, Button } from "@ui/index";
import type { Project } from "@types-pkg/index";
import { analyzeProjectConsistency, type ConsistencyIssue } from "@/lib/utils/consistency-checker";
import { cn } from "@utils/index";

export function ValidationCenterTab({ project }: { project: Project }) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(new Date());
  const [revalidatedCount, setRevalidatedCount] = useState(0);

  const validationResult = useMemo(() => {
    return analyzeProjectConsistency(project);
  }, [project, revalidatedCount]);

  const handleRunValidation = () => {
    setIsValidating(true);
    setTimeout(() => {
      setLastValidated(new Date());
      setRevalidatedCount((prev) => prev + 1);
      setIsValidating(false);
    }, 800);
  };

  const handleExportValidationReport = () => {
    const reportText = `# Validation & Consistency Report - ${project.name}
Generated: ${new Date().toLocaleString()}
Overall Engineering Score: ${validationResult.overallScore}%
Consistency Score: ${validationResult.consistencyScore}%

## Category Scores
- Architecture: ${validationResult.categories.architecture.score}% (${validationResult.categories.architecture.status})
- Database: ${validationResult.categories.database.score}% (${validationResult.categories.database.status})
- API Specification: ${validationResult.categories.api.score}% (${validationResult.categories.api.status})
- Security Report: ${validationResult.categories.security.score}% (${validationResult.categories.security.status})
- Deployment Plan: ${validationResult.categories.deployment.score}% (${validationResult.categories.deployment.status})
- Documentation: ${validationResult.categories.documentation.score}% (${validationResult.categories.documentation.status})

## Issues Identified (${validationResult.issues.length})
${validationResult.issues.map((i, idx) => `${idx + 1}. [${i.severity.toUpperCase()}] ${i.title}\n   - ${i.description}\n   - Impact: ${i.impact}\n   - Fix: ${i.suggestedFix}\n`).join("\n")}
`;

    const blob = new Blob([reportText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}-validation-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Top Action Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="font-heading text-lg font-bold text-white">AI Engineering Validation Center</h2>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Live Inspector
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Automated cross-artifact validation matrix checking system integrity across Architecture, Database, API, Security, and Deployment models.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunValidation}
            disabled={isValidating}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
            {isValidating ? "Validating..." : "Revalidate Project"}
          </Button>

          <Button
            variant="gradient"
            size="sm"
            onClick={handleExportValidationReport}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Export Validation Report
          </Button>
        </div>
      </div>

      {/* Primary Score Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Overall Engineering Score</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-white">{validationResult.overallScore}%</span>
            <span className={cn("text-xs font-bold", validationResult.overallScore >= 80 ? "text-emerald-400" : "text-amber-400")}>
              {validationResult.overallScore >= 80 ? "Production Ready" : "Requires Attention"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Cross-Artifact Consistency</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-indigo-400">{validationResult.consistencyScore}%</span>
            <span className="text-xs text-neutral-500 font-mono">{validationResult.issues.length} Issues</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Security & Compliance</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading text-3xl font-extrabold text-emerald-400">
              {validationResult.categories.security.score}%
            </span>
            <span className="text-xs text-neutral-400">{validationResult.categories.security.status}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Last Verified</span>
          <div className="mt-2 text-xs font-mono text-neutral-300">
            {lastValidated ? lastValidated.toLocaleTimeString() : "Not run yet"}
          </div>
          <span className="text-[11px] text-neutral-500 block mt-1">Checked across 7 categories</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">
          Validation Scores by Engineering Category
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "architecture", label: "Architecture Quality", icon: Boxes, color: "text-indigo-400", bg: "bg-indigo-500/10", data: validationResult.categories.architecture },
            { key: "database", label: "Database Quality", icon: Database, color: "text-violet-400", bg: "bg-violet-500/10", data: validationResult.categories.database },
            { key: "api", label: "API Quality", icon: Code2, color: "text-sky-400", bg: "bg-sky-500/10", data: validationResult.categories.api },
            { key: "security", label: "Security Quality", icon: ShieldCheck, color: "text-emerald-400", bg: "bg-emerald-500/10", data: validationResult.categories.security },
            { key: "deployment", label: "Deployment Quality", icon: Rocket, color: "text-orange-400", bg: "bg-orange-500/10", data: validationResult.categories.deployment },
            { key: "documentation", label: "Documentation Quality", icon: FileText, color: "text-pink-400", bg: "bg-pink-500/10", data: validationResult.categories.documentation },
          ].map((item) => (
            <div key={item.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", item.bg, item.color)}>
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="font-heading text-sm font-bold text-white">{item.label}</span>
                </div>
                <Badge variant={item.data.score >= 80 ? "success" : item.data.score > 0 ? "warning" : "outline"} className="text-[10px]">
                  {item.data.score}%
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", item.data.score >= 80 ? "bg-emerald-500" : item.data.score >= 50 ? "bg-amber-500" : "bg-neutral-600")}
                    style={{ width: `${item.data.score}%` }}
                  />
                </div>
                <span className="text-[10.5px] text-neutral-400 font-mono block">Status: {item.data.status}</span>
              </div>

              {item.data.recommendations.length > 0 && (
                <div className="text-[11px] text-neutral-400 bg-neutral-950/80 p-2.5 rounded-lg border border-white/5 space-y-1">
                  <span className="font-bold text-neutral-300 block text-[10px] uppercase">Recommendation:</span>
                  <p className="leading-snug">{item.data.recommendations[0]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consistency Issues Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-white">
              Identified Consistency Issues ({validationResult.issues.length})
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px]">Auto-Detected</Badge>
        </div>

        {validationResult.issues.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">All Project Artifacts Are Consistent</p>
            <p className="text-xs text-neutral-400">No cross-artifact mismatches were found between Architecture, Database, API, and Deployment specifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {validationResult.issues.map((issue) => (
              <div key={issue.id} className="rounded-xl border border-white/10 bg-neutral-950 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={issue.severity === "critical" ? "danger" : issue.severity === "warning" ? "warning" : "outline"} className="text-[9px] uppercase font-bold">
                      {issue.severity}
                    </Badge>
                    <span className="font-bold text-sm text-white">{issue.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded">
                    <span>{issue.sourceArtifact}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>{issue.targetArtifact}</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed font-sans">{issue.description}</p>
                <div className="text-[11px] text-amber-400/90 font-mono">Impact: {issue.impact}</div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                  <span className="text-primary-300 font-medium flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary-400" />
                    Fix: {issue.suggestedFix}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleRunValidation} className="text-[11px] text-neutral-300 hover:text-white">
                    Re-check
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
