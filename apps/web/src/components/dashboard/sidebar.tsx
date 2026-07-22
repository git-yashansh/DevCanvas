import { useRef, useEffect, useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import gsap from "gsap";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  GitBranch,
  Settings,
  LifeBuoy,
  ChevronLeft,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import { cn } from "@utils/index";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const mainNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { id: "projects", label: "Projects", href: "/app/projects", icon: FolderKanban },
  { id: "chat", label: "AI Chat", href: "/app/chat", icon: MessageSquare, badge: "New" },
];

const toolsNav: NavItem[] = [
  { id: "architecture", label: "Architecture", href: "/app/architecture", icon: Boxes },
  { id: "database", label: "Database Designer", href: "/app/database", icon: Database },
  { id: "api-generator", label: "API Generator", href: "/app/api-generator", icon: Code2 },
  { id: "security", label: "Security Center", href: "/app/security", icon: ShieldCheck },
  { id: "repo", label: "Repo Analyzer", href: "/app/repo", icon: GitBranch },
];

const bottomNav: NavItem[] = [
  { id: "support", label: "Support", href: "/app/support", icon: LifeBuoy },
  { id: "settings", label: "Settings", href: "/app/settings", icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const liquidDotRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredY, setHoveredY] = useState<number | null>(null);

  // ── Entrance animation ─────────────────────────────────────
  useEffect(() => {
    if (!sidebarRef.current) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Slide in sidebar
      gsap.fromTo(
        sidebarRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );

      // Stagger nav items
      const items = sidebarRef.current?.querySelectorAll(".nav-item-anim");
      if (items && items.length > 0) {
        gsap.fromTo(
          items,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: "power2.out", delay: 0.2 }
        );
      }
    }, sidebarRef);

    return () => ctx.revert();
  }, []);

  // ── GSAP Liquid Tracker for Active / Hover Item ───────────
  useEffect(() => {
    if (!navContainerRef.current) return;
    const navContainer = navContainerRef.current;
    const activeEl = navContainer.querySelector<HTMLElement>(".is-active-nav");

    if (activeEl && activePillRef.current) {
      const containerRect = navContainer.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const topOffset = activeRect.top - containerRect.top;
      const height = activeRect.height;

      gsap.to(activePillRef.current, {
        y: topOffset,
        height: height,
        duration: 0.35,
        ease: "power3.out",
      });
    }
  }, [location.pathname, sidebarCollapsed]);

  // ── Liquid Dot position on mouse hover ────────────────────
  useEffect(() => {
    if (!liquidDotRef.current || hoveredY === null) {
      if (liquidDotRef.current) {
        gsap.to(liquidDotRef.current, { opacity: 0, scale: 0.5, duration: 0.2 });
      }
      return;
    }

    gsap.to(liquidDotRef.current, {
      y: hoveredY - 4,
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    });
  }, [hoveredY]);

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: sidebarCollapsed ? 72 : 264,
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.12)",
      }}
      className="relative z-30 hidden shrink-0 transition-[width] duration-300 ease-in-out md:flex md:flex-col"
    >
      {/* Top subtle highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* ── Brand Header ────────────────────────────────────── */}
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.08] px-4">
        {!sidebarCollapsed ? (
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105">
              <span className="font-heading text-sm font-bold text-white">D</span>
            </div>
            <span className="font-heading text-base font-semibold text-white tracking-tight">
              DevCanvas
            </span>
          </Link>
        ) : null}
        <div className="flex-1" />
        <button
          onClick={toggleSidebar}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-all hover:bg-white/10 hover:text-white",
            sidebarCollapsed && "mx-auto",
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              sidebarCollapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* ── Navigation List Container ───────────────────────── */}
      <div ref={navContainerRef} className="relative flex-1 overflow-y-auto px-3 py-4">
        {/* GSAP Liquid Hover Dot Rail Indicator */}
        <div
          ref={liquidDotRef}
          className="pointer-events-none absolute left-1 top-0 h-2 w-2 rounded-full bg-indigo-400 opacity-0 shadow-[0_0_8px_rgba(129,140,248,0.8)] z-20"
        />

        {/* Sliding Active Pill Background */}
        {!sidebarCollapsed && (
          <div
            ref={activePillRef}
            className="pointer-events-none absolute left-3 right-3 top-0 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-md transition-opacity z-0"
            style={{
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {/* Glowing left accent bar */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-violet-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
          </div>
        )}

        <NavSection
          items={mainNav}
          collapsed={sidebarCollapsed}
          location={location.pathname}
          onHoverItem={(y) => setHoveredY(y)}
        />

        <div className="my-4 border-t border-white/[0.08]" />

        {!sidebarCollapsed ? (
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Generators
          </p>
        ) : null}

        <NavSection
          items={toolsNav}
          collapsed={sidebarCollapsed}
          location={location.pathname}
          onHoverItem={(y) => setHoveredY(y)}
        />
      </div>

      {/* ── Bottom Nav & Usage Card ─────────────────────────── */}
      <div className="border-t border-white/[0.08] px-3 py-4">
        <NavSection
          items={bottomNav}
          collapsed={sidebarCollapsed}
          location={location.pathname}
          onHoverItem={(y) => setHoveredY(y)}
        />

        {!sidebarCollapsed ? (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-3.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Zap className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold text-white/80">
                Free plan
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-white/40">
              3 projects remaining
            </p>
            
            {/* Progress bar fill + shimmer */}
            <div className="relative mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-[width] duration-1000 ease-out"
                style={{ width: "33%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer opacity-70" />
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function NavSection({
  items,
  collapsed,
  location,
  onHoverItem,
}: {
  items: NavItem[];
  collapsed: boolean;
  location: string;
  onHoverItem: (y: number | null) => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/app" && location.startsWith(item.href));

        return (
          <li
            key={item.id}
            className={cn("nav-item-anim relative z-10", isActive && "is-active-nav")}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect();
              if (parentRect) {
                onHoverItem(rect.top - parentRect.top + rect.height / 2);
              }
            }}
            onMouseLeave={() => onHoverItem(null)}
          >
            <NavLink
              to={item.href}
              end={item.href === "/app"}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "text-white font-semibold"
                  : "text-white/40 hover:text-white/90"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-indigo-400" : "text-white/40 group-hover:text-white"
                )}
              />
              {!collapsed ? (
                <>
                  <span className="flex-1 tracking-tight">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  ) : null}
                </>
              ) : null}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}
