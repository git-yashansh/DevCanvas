import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ArrowUpRight } from "lucide-react";
import {
  LayoutDashboard, FolderKanban, MessageSquare,
  Boxes, Database, Code2, ShieldCheck,
  GitBranch, FileText, Rocket, Settings, type LucideIcon,
} from "lucide-react";
import { useProjects } from "@/lib/queries/projects";
import { cn } from "@utils/index";

interface NavItem { label: string; href: string; icon: LucideIcon; badge?: string }

const mainNav: NavItem[] = [
  { label: "Dashboard",  href: "/app",           icon: LayoutDashboard },
  { label: "Projects",   href: "/app/projects",  icon: FolderKanban },
  { label: "AI Chat",    href: "/app/chat",       icon: MessageSquare, badge: "New" },
];
const toolsNav: NavItem[] = [
  { label: "Architecture",       href: "/app/architecture", icon: Boxes },
  { label: "Database Designer",  href: "/app/database",     icon: Database },
  { label: "API Generator",      href: "/app/api-generator",icon: Code2 },
  { label: "Security Center",    href: "/app/security",     icon: ShieldCheck },
  { label: "Repo Analyzer",      href: "/app/repo",         icon: GitBranch },
  { label: "Documentation",      href: "/app/documentation",icon: FileText },
  { label: "Deployment Planner", href: "/app/deployment",   icon: Rocket },
];
const bottomNav: NavItem[] = [
  { label: "Settings", href: "/app/settings", icon: Settings },
];

const MAX_PROJECTS = 5;

function NavList({ items, onClick }: { items: NavItem[]; onClick: () => void }) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.href}>
          <NavLink
            to={item.href}
            end={item.href === "/app"}
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#00e699]/10 text-[#00e699] border border-[#00e699]/25 font-bold"
                  : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-[#00e699]" : "text-neutral-400"
                )} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-[#00e699]/20 border border-[#00e699]/30 px-1.5 py-0.5 text-[9px] font-bold text-[#00e699]">
                    {item.badge}
                  </span>
                )}
              </>
            )}

          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const { data: projects } = useProjects();
  const projectCount = projects?.length ?? 0;
  const remaining = Math.max(0, MAX_PROJECTS - projectCount);
  const pct = Math.min(100, (projectCount / MAX_PROJECTS) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 md:hidden"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: "spring", stiffness: 380, damping: 38 }}
          className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-hidden"
          style={{
            background: "rgba(10,10,14,0.97)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-white/[0.07] px-4">
            <Link to="/app" onClick={onClose} className="flex items-center gap-2.5 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                <span className="font-heading text-xs font-bold text-white">D</span>
              </div>
              <div>
                <span className="block font-heading text-sm font-semibold text-white">DevCanvas</span>
                <span className="block text-[9px] text-white/30 -mt-0.5">Workspace</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] text-white/30 hover:border-white/15 hover:text-white/80 transition-all"
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-3">
            <NavList items={mainNav} onClick={onClose} />
            <div className="my-3 border-t border-white/[0.07]" />
            <p className="mb-2 px-3 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white/25">
              Generators
            </p>
            <NavList items={toolsNav} onClick={onClose} />
          </nav>

          {/* Bottom */}
          <div className="shrink-0 border-t border-white/[0.07] px-3 py-3 space-y-3">
            <NavList items={bottomNav} onClick={onClose} />

            {/* Plan card */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/20">
                    <Zap className="h-3 w-3 text-indigo-400" />
                  </span>
                  <span className="text-[11px] font-semibold text-white/80">Free Plan</span>
                </div>
                <Link
                  to="/app/settings"
                  onClick={onClose}
                  className="flex items-center gap-0.5 text-[9px] font-medium text-indigo-400/70 hover:text-indigo-300 transition-colors"
                >
                  Upgrade <ArrowUpRight className="h-2.5 w-2.5" />
                </Link>
              </div>
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Projects used</span>
                  <span className="text-[10px] font-semibold text-white/60">{projectCount} / {MAX_PROJECTS}</span>
                </div>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-700 ease-out",
                      pct >= 80 ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[9.5px] text-white/25">
                  {remaining > 0 ? `${remaining} project${remaining !== 1 ? "s" : ""} remaining` : "Limit reached · Upgrade for more"}
                </p>
              </div>
            </div>
          </div>

          <style>{`
            .sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.07) transparent; }
            .sidebar-scroll::-webkit-scrollbar { width: 3px; }
            .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
            .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 999px; }
            .sidebar-scroll:hover::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.11); }
          `}</style>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
