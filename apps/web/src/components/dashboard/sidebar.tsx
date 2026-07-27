import { useRef, useEffect, useState, useCallback } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  GitBranch,
  FileText,
  Rocket,
  Settings,
  LifeBuoy,
  ChevronLeft,
  Zap,
  Plus,
  Keyboard,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import { useProjects } from "@/lib/queries/projects";
import { cn } from "@utils/index";

// ── Nav Data ────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  short: string;   // 3–6 char collapsed label
  href: string;
  icon: LucideIcon;
  badge?: { text: string; color: "indigo" | "emerald" | "amber" };
}

const mainNav: NavItem[] = [
  { id: "dashboard",  label: "Dashboard",  short: "Dash",  href: "/app",           icon: LayoutDashboard },
  { id: "projects",   label: "Projects",   short: "Proj",  href: "/app/projects",  icon: FolderKanban },
  { id: "chat",       label: "Workspace AI", short: "AI",    href: "/app/chat",      icon: MessageSquare,  badge: { text: "New", color: "emerald" } },
];

const toolsNav: NavItem[] = [
  { id: "architecture",  label: "Architecture",       short: "Arch",    href: "/app/architecture", icon: Boxes },
  { id: "database",      label: "Database Designer",  short: "DB",      href: "/app/database",     icon: Database },
  { id: "api-generator", label: "API Generator",      short: "API",     href: "/app/api-generator",icon: Code2 },
  { id: "security",      label: "Security Center",    short: "Sec",     href: "/app/security",     icon: ShieldCheck },
  { id: "repo",          label: "Repo Analyzer",      short: "Repo",    href: "/app/repo",         icon: GitBranch },
  { id: "documentation", label: "Documentation",      short: "Docs",    href: "/app/documentation",icon: FileText },
  { id: "deployment",    label: "Deployment Planner", short: "Deploy",  href: "/app/deployment",   icon: Rocket },
];

const bottomNav: NavItem[] = [
  { id: "support",  label: "Support",  short: "Help", href: "/app/support",  icon: LifeBuoy },
  { id: "settings", label: "Settings", short: "Cfg",  href: "/app/settings", icon: Settings },
];

const MAX_PROJECTS = 5;

// ── Badge colors ─────────────────────────────────────────────
const BADGE_COLORS = {
  indigo:  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  amber:   "bg-amber-500/20  text-amber-300  border-amber-500/30",
};

// ── Tooltip ──────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip">
      {children}
      <div
        className={cn(
          "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50",
          "whitespace-nowrap rounded-lg border border-white/10 bg-[#141418] px-2.5 py-1.5",
          "text-xs font-medium text-white shadow-xl",
          "opacity-0 scale-95 translate-x-1 group-hover/tip:opacity-100 group-hover/tip:scale-100 group-hover/tip:translate-x-0",
          "transition-all duration-150 ease-out"
        )}
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#141418]" />
      </div>
    </div>
  );
}

// ── Single Nav Item ───────────────────────────────────────────
function NavItem({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;

  const inner = (
    <NavLink
      to={item.href}
      end={item.href === "/app"}
      aria-label={item.label}
      className={cn(
        "group relative flex items-center rounded-lg transition-all duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
        collapsed ? "flex-col gap-0.5 px-1 py-2 w-full justify-center" : "gap-3 px-3 py-2",
        isActive
          ? "bg-white/[0.07] text-white"
          : "text-white/40 hover:bg-white/[0.04] hover:text-white/80"
      )}
    >
      {/* Left accent bar for active (expanded only) */}
      {!collapsed && isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          "shrink-0 transition-all duration-200",
          collapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
          isActive
            ? "text-indigo-400"
            : "text-white/35 group-hover:text-white/75"
        )}
      />

      {/* Collapsed: short label */}
      {collapsed && (
        <span
          className={cn(
            "text-[9px] font-semibold leading-none tracking-wide transition-colors duration-200",
            isActive ? "text-indigo-300" : "text-white/30 group-hover:text-white/60"
          )}
        >
          {item.short}
        </span>
      )}

      {/* Expanded: full label + badge */}
      {!collapsed && (
        <>
          <span className="flex-1 text-sm font-medium tracking-tight leading-none">{item.label}</span>
          {item.badge && (
            <span className={cn(
              "rounded-full border px-1.5 py-0.5 text-[9px] font-bold leading-none",
              BADGE_COLORS[item.badge.color]
            )}>
              {item.badge.text}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  return collapsed ? <Tooltip label={item.label}>{inner}</Tooltip> : inner;
}

// ── Main Sidebar ─────────────────────────────────────────────
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();
  const { data: projects } = useProjects();

  const projectCount = projects?.length ?? 0;
  const projectsRemaining = Math.max(0, MAX_PROJECTS - projectCount);
  const usagePct = Math.min(100, (projectCount / MAX_PROJECTS) * 100);

  const isActive = useCallback(
    (item: NavItem) =>
      location.pathname === item.href ||
      (item.href !== "/app" && location.pathname.startsWith(item.href)),
    [location.pathname]
  );

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 88 : 272,
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
      className="relative z-30 hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:flex md:flex-col"
    >
      {/* Top shimmer line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-white/[0.07] px-3 transition-all duration-300",
          sidebarCollapsed ? "justify-center" : "gap-2.5"
        )}
      >
        {/* Logo mark */}
        <Link
          to="/app"
          className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 shadow-lg shadow-indigo-500/20 transition-transform duration-200 hover:scale-105"
          style={{ width: 32, height: 32 }}
          aria-label="DevCanvas home"
        >
          <span className="font-heading text-sm font-bold text-white select-none">D</span>
        </Link>

        {/* Brand name */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            sidebarCollapsed ? "w-0 opacity-0" : "flex-1 opacity-100"
          )}
        >
          <span className="block whitespace-nowrap font-heading text-[15px] font-semibold text-white tracking-tight">
            DevCanvas
          </span>
          <span className="block whitespace-nowrap text-[10px] text-white/30 tracking-wide -mt-0.5">
            Workspace
          </span>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/30 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.07] hover:text-white/80",
            sidebarCollapsed && "ml-0"
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              sidebarCollapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* ── Scrollable Nav ──────────────────────────────────── */}
      <nav
        className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-2 py-3"
        aria-label="Main navigation"
      >
        {/* Main section */}
        <ul className="space-y-0.5">
          {mainNav.map((item) => (
            <li key={item.id}>
              <NavItem item={item} collapsed={sidebarCollapsed} isActive={isActive(item)} />
            </li>
          ))}
        </ul>

        {/* Divider + Generators label */}
        <div className="my-3 px-1">
          <div className="border-t border-white/[0.07]" />
        </div>

        {!sidebarCollapsed ? (
          <p className="mb-2 px-3 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/25">
            Generators
          </p>
        ) : (
          <div className="mb-2 flex justify-center">
            <div className="h-px w-5 bg-white/15 rounded" />
          </div>
        )}

        <ul className="space-y-0.5">
          {toolsNav.map((item) => (
            <li key={item.id}>
              <NavItem item={item} collapsed={sidebarCollapsed} isActive={isActive(item)} />
            </li>
          ))}
        </ul>

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <>
            <div className="my-3 px-1">
              <div className="border-t border-white/[0.07]" />
            </div>
            <p className="mb-2 px-3 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/25">
              Quick Actions
            </p>
            <div className="space-y-0.5">
              <Link
                to="/app/projects?new=1"
                className="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-white/35 transition-all duration-150 hover:bg-white/[0.04] hover:text-white/80"
              >
                <Plus className="h-3.5 w-3.5 text-white/30 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[12px] font-medium">New Project</span>
              </Link>
              <Link
                to="/app/repo"
                className="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-white/35 transition-all duration-150 hover:bg-white/[0.04] hover:text-white/80"
              >
                <GitBranch className="h-3.5 w-3.5 text-white/30 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[12px] font-medium">Import Repository</span>
              </Link>
              <Link
                to="/app/chat"
                className="group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-white/35 transition-all duration-150 hover:bg-white/[0.04] hover:text-white/80"
              >
                <MessageSquare className="h-3.5 w-3.5 text-white/30 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[12px] font-medium">AI Chat</span>
              </Link>
              <button
                onClick={() => alert("Press ? to see keyboard shortcuts")}
                className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-white/35 transition-all duration-150 hover:bg-white/[0.04] hover:text-white/80"
              >
                <Keyboard className="h-3.5 w-3.5 text-white/30 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[12px] font-medium">Keyboard Shortcuts</span>
              </button>
            </div>
          </>
        )}
      </nav>

      {/* ── Bottom ──────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.07] px-2 py-3 space-y-3">
        {/* Bottom nav items */}
        <ul className="space-y-0.5">
          {bottomNav.map((item) => (
            <li key={item.id}>
              <NavItem item={item} collapsed={sidebarCollapsed} isActive={isActive(item)} />
            </li>
          ))}
        </ul>

        {/* Free Plan Card (expanded) */}
        {!sidebarCollapsed && (
          <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 backdrop-blur-md">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/20">
                  <Zap className="h-3 w-3 text-indigo-400" />
                </span>
                <span className="text-[11px] font-semibold text-white/80">Free Plan</span>
              </div>
              <Link
                to="/app/settings"
                className="flex items-center gap-0.5 text-[9px] font-medium text-indigo-400/70 hover:text-indigo-300 transition-colors"
              >
                Upgrade <ArrowUpRight className="h-2.5 w-2.5" />
              </Link>
            </div>

            {/* Usage */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/35">Projects used</span>
                <span className="text-[10px] font-semibold text-white/60">
                  {projectCount} / {MAX_PROJECTS}
                </span>
              </div>

              {/* Progress bar */}
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 ease-out",
                    usagePct >= 80
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
                  )}
                  style={{ width: `${usagePct}%` }}
                />
              </div>

              <p className="text-[9.5px] text-white/25">
                {projectsRemaining > 0
                  ? `${projectsRemaining} project${projectsRemaining !== 1 ? "s" : ""} remaining`
                  : "Limit reached · Upgrade for more"}
              </p>
            </div>

            {/* Upgrade CTA */}
            <Link
              to="/app/settings"
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 px-2",
                "text-[10px] font-semibold transition-all duration-200",
                projectsRemaining === 0
                  ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-md shadow-indigo-500/20"
                  : "border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70"
              )}
            >
              <Zap className="h-3 w-3" />
              {projectsRemaining === 0 ? "Upgrade Now" : "Upgrade Plan"}
            </Link>
          </div>
        )}

        {/* Collapsed: minimal usage dot indicator */}
        {sidebarCollapsed && (
          <Tooltip label={`${projectCount}/${MAX_PROJECTS} Projects`}>
            <div className="flex flex-col items-center gap-1 py-1">
              <div className="relative h-1.5 w-10 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 ease-out",
                    usagePct >= 80
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-gradient-to-r from-indigo-500 to-violet-500"
                  )}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <span className="text-[8px] font-bold text-white/20">
                {projectCount}/{MAX_PROJECTS}
              </span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Custom scrollbar styles scoped to sidebar */}
      <style>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
        }
        .sidebar-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          transition: background 0.2s;
        }
        .sidebar-scroll:hover::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
        }
      `}</style>
    </aside>
  );
}
