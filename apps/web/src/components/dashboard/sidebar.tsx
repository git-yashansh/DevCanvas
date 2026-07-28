import { useCallback } from "react";
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
  Menu,
  Zap,
  Plus,
  ArrowUpRight,
  User,
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
  { id: "dashboard", label: "Home", short: "Home", href: "/app", icon: LayoutDashboard },
  { id: "projects", label: "Projects", short: "Projects", href: "/app/projects", icon: FolderKanban },
  { id: "chat", label: "Workspace AI", short: "AI Chat", href: "/app/chat", icon: MessageSquare, badge: { text: "New", color: "emerald" } },
];

const toolsNav: NavItem[] = [
  { id: "architecture", label: "Architecture", short: "Arch", href: "/app/architecture", icon: Boxes },
  { id: "database", label: "Database", short: "Database", href: "/app/database", icon: Database },
  { id: "api-generator", label: "API Spec", short: "API", href: "/app/api-generator", icon: Code2 },
  { id: "security", label: "Security", short: "Security", href: "/app/security", icon: ShieldCheck },
  { id: "repo", label: "Repo Analyzer", short: "Repo", href: "/app/repo", icon: GitBranch },
  { id: "documentation", label: "Docs", short: "Docs", href: "/app/documentation", icon: FileText },
  { id: "deployment", label: "Deployment", short: "Deploy", href: "/app/deployment", icon: Rocket },
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
          "text-xs font-semibold text-white shadow-2xl",
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

// ── Nav Item Component (Inspired by Screenshot Rail Layout) ───
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

  const inner = (
    <NavLink
      to={item.href}
      end={item.href === "/app"}
      aria-label={item.label}
      className={cn(
        "group relative flex items-center transition-all duration-200 outline-none select-none rounded-xl",
        collapsed
          ? "flex-col gap-1 py-2 px-1 w-16 justify-center text-center"
          : "gap-3 px-3.5 py-2.5 w-full",
        isActive
          ? "bg-[#00e699]/10 text-[#00e699] border border-[#00e699]/25 shadow-[0_0_12px_rgba(0,230,153,0.15)] font-bold"
          : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 font-medium"
      )}
    >
      {/* Icon */}
      <Icon
        className={cn(
          "shrink-0 transition-colors duration-200",
          collapsed ? "h-5 w-5" : "h-4 w-4",
          isActive ? "text-[#00e699]" : "text-neutral-400 group-hover:text-neutral-200"
        )}
      />

      {/* Label */}
      <span
        className={cn(
          "transition-colors duration-200 truncate",
          collapsed
            ? "text-[10px] font-semibold tracking-tight leading-none text-center w-full mt-0.5"
            : "flex-1 text-xs tracking-tight"
        )}
      >
        {collapsed ? item.short : item.label}
      </span>

      {/* Badge in expanded view */}
      {!collapsed && item.badge && (
        <span className="rounded-full border border-[#00e699]/30 bg-[#00e699]/10 px-2 py-0.5 text-[9px] font-bold text-[#00e699] leading-none">
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
  const { user, profile } = useAuth();

  const projectCount = projects?.length ?? 0;
  const usagePct = Math.min(100, (projectCount / MAX_PROJECTS) * 100);

  const isActive = useCallback(
    (item: NavItem) =>
      location.pathname === item.href ||
      (item.href !== "/app" && location.pathname.startsWith(item.href)),
    [location.pathname]
  );

  const userInitial = profile?.full_name?.[0] || user?.email?.[0] || "Y";

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 82 : 260,
        backgroundColor: "#0B0C0E",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
      }}
      className="relative z-30 hidden shrink-0 transition-[width] duration-300 ease-in-out md:flex md:flex-col text-neutral-200"
    >
      {/* ── 1. Top Section: Hamburger Menu + Avatar Ring (Matching Screenshot) ── */}
      <div className="flex flex-col items-center py-4 border-b border-neutral-850/60 px-3 space-y-4">
        {/* Top Header Row with Circular Hamburger Button */}
        <div
          className={cn(
            "w-full flex items-center transition-all duration-300",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Circular Hamburger Button (Screenshot Style) */}
          <button
            onClick={toggleSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/80 text-neutral-300 transition-all duration-200 hover:border-neutral-700 hover:bg-neutral-800 hover:text-white"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {!sidebarCollapsed && (
            <Link to="/app" className="flex items-center gap-2">
              <span className="font-heading text-sm font-extrabold tracking-tight text-white">
                DevCanvas
              </span>
              <span className="text-[10px] font-bold uppercase text-[#00e699] bg-[#00e699]/10 px-1.5 py-0.5 rounded border border-[#00e699]/20">
                Pro
              </span>
            </Link>
          )}
        </div>

        {/* User Profile Avatar with Rainbow/Gradient Ring Border (Screenshot Style) */}
        <Link
          to="/app/settings"
          className="group relative flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105"
        >
          <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-400 shadow-md">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="User Avatar"
                className="h-10 w-10 rounded-full object-cover border-2 border-[#0B0C0E]"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white uppercase border-2 border-[#0B0C0E]">
                {userInitial}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#00e699] border-2 border-[#0B0C0E]" />
          </div>

          {!sidebarCollapsed && (
            <div className="mt-2 text-center truncate max-w-[180px]">
              <span className="block text-xs font-bold text-white truncate">
                {profile?.full_name || user?.email?.split("@")[0] || "Developer"}
              </span>
              <span className="block text-[10px] text-neutral-500 truncate">
                {user?.email || "yash@devcanvas.ai"}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* ── 2. Scrollable Navigation Rail ────────────────────────────── */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-4">
        {/* Main Nav Items */}
        <div className="space-y-1 flex flex-col items-center">
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
        <div className="w-full px-2">
          <div className="border-t border-neutral-850" />
        </div>

        {/* Generators / Tools Nav Items */}
        <div className="space-y-1 flex flex-col items-center">
          {!sidebarCollapsed && (
            <p className="w-full text-[9.5px] font-bold uppercase tracking-wider text-neutral-500 px-3 mb-1">
              Generators
            </p>
          )}

          {toolsNav.map((item) => (
            <NavItemRow
              key={item.id}
              item={item}
              collapsed={sidebarCollapsed}
              isActive={isActive(item)}
            />
          ))}
        </div>

        {/* Quick Action in Expanded View */}
        {!sidebarCollapsed && (
          <div className="pt-2">
            <Link
              to="/app/projects?new=1"
              className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 py-2.5 px-3 text-xs font-bold text-white transition-all"
            >
              <Plus className="h-4 w-4 text-[#00e699]" />
              <span>New Project</span>
            </Link>
          </div>
        )}
      </nav>

      {/* ── 3. Bottom Pinned Section (Settings & Profile) ────────────── */}
      <div className="shrink-0 border-t border-neutral-850/60 p-2 space-y-2">
        <div className="flex flex-col items-center space-y-1">
          {bottomNav.map((item) => (
            <NavItemRow
              key={item.id}
              item={item}
              collapsed={sidebarCollapsed}
              isActive={isActive(item)}
            />
          ))}
        </div>

        {/* Free Plan Card (Expanded View) */}
        {!sidebarCollapsed && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#00e699]" /> Free Plan
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {projectCount}/{MAX_PROJECTS}
              </span>
            </div>

            <div className="h-1.5 w-full bg-neutral-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#00e699] rounded-full transition-all duration-500"
                style={{ width: `${usagePct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
