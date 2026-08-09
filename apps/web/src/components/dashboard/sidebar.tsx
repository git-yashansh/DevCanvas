import { useCallback } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  GitBranch,
  FileText,
  MoreHorizontal,
  Settings,
  LifeBuoy,
  Menu,
  Zap,
  Plus,
  ArrowUpRight,
  User,
  Server,
  type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import { useProjects } from "@/lib/queries/projects";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/index";

// ── Nav Data Definitions ─────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  short: string;
  href: string;
  icon: LucideIcon;
  badge?: { text: string; color: "emerald" | "amber" };
}

const mainNav: NavItem[] = [
  { id: "home", label: "Home", short: "Home", href: "/app", icon: Home },
  { id: "workspace", label: "Workspace", short: "Workspace", href: "/app/workspace", icon: LayoutDashboard },
  { id: "chat", label: "AI Chat", short: "AI Chat", href: "/app/chat", icon: MessageSquare },
];

const collapsedToolsNav: NavItem[] = [
  { id: "architecture", label: "Architecture", short: "Arch", href: "/app/architecture", icon: Boxes },
  { id: "database", label: "Database", short: "Database", href: "/app/database", icon: Database },
  { id: "api-generator", label: "API Spec", short: "API", href: "/app/api-generator", icon: Code2 },
  { id: "security", label: "Security", short: "Security", href: "/app/security", icon: ShieldCheck },
  { id: "repo", label: "Repo Analyzer", short: "Repo", href: "/app/repo", icon: GitBranch },
  { id: "documentation", label: "Docs", short: "Docs", href: "/app/documentation", icon: FileText },
  { id: "more", label: "More", short: "More", href: "#", icon: MoreHorizontal },
];

const expandedToolsNav: NavItem[] = [
  { id: "architecture", label: "Architecture", short: "Arch", href: "/app/architecture", icon: Boxes },
  { id: "database", label: "Database", short: "Database", href: "/app/database", icon: Database },
  { id: "api-generator", label: "API Spec", short: "API", href: "/app/api-generator", icon: Code2 },
  { id: "security", label: "Security", short: "Security", href: "/app/security", icon: ShieldCheck },
  { id: "repo", label: "Repo Analyzer", short: "Repo", href: "/app/repo", icon: GitBranch },
  { id: "documentation", label: "Docs", short: "Docs", href: "/app/documentation", icon: FileText },
  { id: "ui-generator", label: "UI Generator", short: "UI Gen", href: "/app/ui-generator", icon: LayoutDashboard },
  { id: "docker-architect", label: "Docker Architect", short: "Docker", href: "/app/deployment", icon: Server },
  { id: "cicd-actions", label: "CI/CD Actions", short: "CI/CD", href: "/app/deployment", icon: Zap },
];

const bottomNav: NavItem[] = [
  { id: "support", label: "Support", short: "Help", href: "/app/support", icon: LifeBuoy },
  { id: "settings", label: "Settings", short: "Settings", href: "/app/settings", icon: Settings },
];

const MAX_PROJECTS = 5;

// ── Tooltip Component for Collapsed View ───────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tip w-full flex justify-center">
      {children}
      <div
        className={cn(
          "pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50",
          "whitespace-nowrap rounded-lg border border-neutral-800 bg-[#121216] px-2.5 py-1.5",
          "text-[13px] font-heading font-semibold text-white shadow-2xl",
          "opacity-0 scale-95 translate-x-1 group-hover/tip:opacity-100 group-hover/tip:scale-100 group-hover/tip:translate-x-0",
          "transition-all duration-150 ease-out"
        )}
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#121216]" />
      </div>
    </div>
  );
}

// ── Nav Item Component (Rich, Full Text & Icon Proportioning) ───
function NavItemRow({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}) {
  const Icon = item.icon;
  const { toggleSidebar } = useUIStore();

  const handleClick = (e: React.MouseEvent) => {
    if (item.id === "more") {
      e.preventDefault();
      if (collapsed) {
        toggleSidebar();
      }
    }
  };

  const inner = (
    <NavLink
      to={item.href}
      onClick={handleClick}
      data-tour={item.id}
      end={item.href === "/app" || item.href === "/app/workspace"}
      aria-label={item.label}
      className={cn(
        "group relative flex items-center transition-all duration-300 outline-none select-none rounded-xl",
        collapsed
          ? "flex-col gap-1 py-2 px-1 w-16 justify-center text-center"
          : "gap-3 px-3.5 py-2.5 w-full",
        isActive
          ? "bg-white/[0.06] text-white border border-white/[0.08] shadow-[0_0_12px_rgba(255,255,255,0.02)] font-bold"
          : "text-neutral-400 hover:text-white hover:bg-white/[0.05] font-semibold"
      )}
    >
      {/* Icon */}
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-300",
          collapsed ? "h-5 w-5" : "h-4.5 w-4.5",
          isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
        )}
      />

      {/* Label (Full text readability when expanded) */}
      <span
        className={cn(
          "transition-colors duration-300 whitespace-nowrap truncate",
          collapsed
            ? "font-heading text-[11px] font-semibold tracking-tight leading-none text-center w-full mt-0.5"
            : "flex-1 font-heading text-[15px] font-semibold tracking-normal text-left"
        )}
      >
        {collapsed ? item.short : item.label}
      </span>

      {/* Badge in expanded view */}
      {!collapsed && item.badge && (
        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 leading-none shrink-0">
          {item.badge.text}
        </span>
      )}
    </NavLink>
  );

  return collapsed ? <Tooltip label={item.label}>{inner}</Tooltip> : inner;
}

// ── Main Sidebar Component ────────────────────────────────────
export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();
  const { data: projects } = useProjects();

  const projectCount = projects?.length ?? 0;
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
        width: sidebarCollapsed ? "5.125rem" : "16rem",
        background: "#050505",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.02), 4px 0 24px rgba(0, 0, 0, 0.3)",
      }}
      className="relative z-30 hidden shrink-0 transition-[width] duration-300 ease-in-out md:flex md:flex-col text-neutral-200 h-screen select-none overflow-hidden"
    >
      {/* ── 1. Top Header Row ── */}
      <div
        className={cn(
          "flex items-center shrink-0 h-16 border-b border-white/[0.06]",
          sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"
        )}
      >
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-black text-neutral-300 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white cursor-pointer"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label="Toggle sidebar navigation"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        {!sidebarCollapsed && (
          <span className="font-heading text-[12px] font-extrabold uppercase tracking-widest text-neutral-400 pr-2">
            Navigation
          </span>
        )}
      </div>

      {/* ── 2. Navigation Rail (Full Rich Text Filling) ── */}
      <nav className={cn(
        "flex-1 overflow-hidden px-3 py-3.5 flex flex-col justify-between space-y-4 relative",
        !sidebarCollapsed && "pb-[190px]"
      )}>
        <div className="space-y-3.5">
          {/* Main Nav Section */}
          <div className="space-y-1 flex flex-col items-center">
            {!sidebarCollapsed && (
              <p className="w-full font-heading text-[12px] font-extrabold uppercase tracking-widest text-neutral-400 px-3 mb-1.5">
                Main
              </p>
            )}

            {mainNav.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                collapsed={sidebarCollapsed}
                isActive={isActive(item)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="w-full px-1 py-0.5">
            <div className="border-t border-white/[0.06]" />
          </div>

          {/* Generators / Tools Nav Section */}
          <div
            className={cn(
              "space-y-1 flex flex-col items-center w-full",
              !sidebarCollapsed && "max-h-[calc(100vh-420px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            )}
          >
            {!sidebarCollapsed && (
              <p className="w-full font-heading text-[12px] font-extrabold uppercase tracking-widest text-neutral-400 px-3 mb-1.5">
                Generators
              </p>
            )}

            {(sidebarCollapsed ? collapsedToolsNav : expandedToolsNav).map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                collapsed={sidebarCollapsed}
                isActive={isActive(item)}
              />
            ))}
          </div>
        </div>

        {/* ── 3. Bottom Section: Help & Settings + Free Plan Card ── */}
        <div className={cn(
          "shrink-0 pt-3 border-t border-white/[0.06] space-y-2.5",
          !sidebarCollapsed ? "absolute bottom-0 left-0 right-0 bg-[#050505] p-3 pb-5 z-20" : ""
        )}>
          <div className="space-y-1 flex flex-col items-center">
            {!sidebarCollapsed && (
              <p className="w-full font-heading text-[12px] font-extrabold uppercase tracking-widest text-neutral-400 px-3 mb-1.5">
                Preferences
              </p>
            )}

            {bottomNav.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                collapsed={sidebarCollapsed}
                isActive={isActive(item)}
              />
            ))}
          </div>

          {/* Free Plan Card (Expanded View - Full Rich Visuals) */}
          {!sidebarCollapsed && (
            <div className="shrink-0 rounded-xl border border-white/[0.06] bg-[#0A0A0A] p-3 space-y-2 mt-1 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="font-heading font-bold text-white flex items-center gap-1.5 text-[13px]">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" /> Free Plan
                </span>
                <span className="text-[11px] text-neutral-400 font-mono font-semibold">
                  {projectCount}/{MAX_PROJECTS}
                </span>
              </div>

              <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
