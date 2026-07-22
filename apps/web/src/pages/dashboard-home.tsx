import { useNavigate } from "react-router-dom";
import { FolderKanban, Activity, TrendingUp, Boxes, Zap, Clock, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProjectCard, ProjectCardSkeleton, EmptyProjects } from "@/components/dashboard/project-card";
import { useProjects } from "@/lib/queries/projects";
import { useRecentActivity } from "@/lib/queries/activity";
import { useAuth } from "@/lib/auth-context";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardHomePage() {
  const { profile } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const { data: activity } = useRecentActivity();
  const navigate = useNavigate();

  const recentProjects = projects?.slice(0, 6) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* ── Page Header ────────────────────────────────────────── */}
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(" ")[0] ?? "engineer"}`}
        description="Your AI engineering workspace. Generate, analyze, and ship."
        actions={
          <button
            onClick={() => navigate("/app/projects/new")}
            className="flex items-center gap-2 rounded-xl bg-[#7C5CFF] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#8B6CFF] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
        }
      />

      {/* ── Stat Cards with Semantic Icon Colors ───────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={projects?.length ?? 0}
          delta={`${projects?.filter((p) => p.status === "active").length ?? 0} active`}
          deltaType="up"
          icon={FolderKanban}
          colorType="blue"
        />
        <StatCard
          label="Generations"
          value={activity?.length ?? 0}
          delta="AI artifacts created"
          deltaType="up"
          icon={Boxes}
          colorType="purple"
        />
        <StatCard
          label="Avg. security score"
          value="A"
          delta="No critical issues"
          deltaType="up"
          icon={TrendingUp}
          colorType="green"
        />
        <StatCard
          label="Active this week"
          value={projects?.filter((p) => {
            const updated = new Date(p.updated_at ?? p.created_at);
            return Date.now() - updated.getTime() < 7 * 24 * 60 * 60 * 1000;
          }).length ?? 0}
          delta="projects updated"
          deltaType="up"
          icon={Zap}
          colorType="orange"
        />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
          Quick actions
        </h2>
        <QuickActions />
      </div>

      {/* ── Recent Projects ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
            Recent projects
          </h2>
          <button
            onClick={() => navigate("/app/projects")}
            className="text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          ) : recentProjects.length === 0 ? (
            <div className="col-span-full">
              <EmptyProjects />
            </div>
          ) : (
            recentProjects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))
          )}
        </div>
      </div>

      {/* ── Activity & Status Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity Card */}
        <div
          style={{
            backgroundColor: "#18181B",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "20px",
          }}
          className="p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#F59E0B]" />
            <h3 className="font-sans text-sm font-semibold text-[#FAFAFA]">
              Recent activity
            </h3>
          </div>
          {activity && activity.length > 0 ? (
            <div className="space-y-2.5">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#202024] px-3.5 py-2.5 transition-colors hover:border-white/10"
                >
                  <span className="text-sm text-[#A1A1AA] truncate">{item.content}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-[#71717A]">
                    <Clock className="h-3 w-3" />
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {[
                "Generate your first architecture diagram",
                "Design a database schema",
                "Analyze your API security",
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-white/10 px-3.5 py-2.5"
                >
                  <span className="text-sm text-[#71717A]">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects by Status Card */}
        <div
          style={{
            backgroundColor: "#18181B",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "20px",
          }}
          className="p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#10B981]" />
            <h3 className="font-sans text-sm font-semibold text-[#FAFAFA]">
              Projects by status
            </h3>
          </div>
          {projects && projects.length > 0 ? (
            <div className="space-y-4">
              {(["active", "draft", "archived"] as const).map((status) => {
                const count = projects.filter((p) => p.status === status).length;
                const pct = projects.length ? Math.round((count / projects.length) * 100) : 0;
                const barColors = {
                  active: "bg-[#7C5CFF]",
                  draft: "bg-[#F59E0B]",
                  archived: "bg-[#71717A]",
                };
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="capitalize text-[#A1A1AA] font-medium">{status}</span>
                      <span className="text-[#71717A] font-mono">{count}</span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#202024]">
                      <div
                        className={`h-1.5 rounded-full ${barColors[status]} transition-[width] duration-300 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-[#71717A]">
              No projects yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
