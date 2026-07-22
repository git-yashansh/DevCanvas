import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@utils/index";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Projects", href: "/app/projects", icon: FolderKanban },
  { label: "AI Chat", href: "/app/chat", icon: MessageSquare },
];

const toolsNav: NavItem[] = [
  { label: "Architecture", href: "/app/architecture", icon: Boxes },
  { label: "Database Designer", href: "/app/database", icon: Database },
  { label: "API Generator", href: "/app/api-generator", icon: Code2 },
  { label: "Security Center", href: "/app/security", icon: ShieldCheck },
  { label: "Repo Analyzer", href: "/app/repo", icon: GitBranch },
];

const bottomNav: NavItem[] = [
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 md:hidden"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.aside
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-surface"
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Workspace
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-surface-2 hover:text-neutral-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <NavList items={mainNav} onClick={onClose} />
            <div className="my-4 border-t border-border" />
            <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-neutral-600">
              Generators
            </p>
            <NavList items={toolsNav} onClick={onClose} />
          </nav>
          <div className="border-t border-border px-3 py-4">
            <NavList items={bottomNav} onClick={onClose} />
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}

function NavList({
  items,
  onClick,
}: {
  items: NavItem[];
  onClick: () => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.href}>
          <NavLink
            to={item.href}
            end={item.href === "/app"}
            onClick={onClick}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-500/10 text-primary-300"
                  : "text-neutral-400 hover:bg-surface-2 hover:text-neutral-100",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
