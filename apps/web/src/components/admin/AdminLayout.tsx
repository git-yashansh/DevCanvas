import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@utils/index";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  Ticket,
  FolderGit2,
  BarChart3,
  Cpu,
  ShieldCheck,
  Bell,
  FileSpreadsheet,
  Settings,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  Server,
  HelpCircle,
  MessageSquareCode,
  Flame,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Tickets", path: "/admin/tickets", icon: Ticket },
  { label: "Projects", path: "/admin/projects", icon: FolderGit2 },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "AI Operations", path: "/admin/ai", icon: Cpu },
  { label: "System Health", path: "/admin/system", icon: Server },
  { label: "Security & IPs", path: "/admin/security", icon: ShieldCheck },
  { label: "Announcements", path: "/admin/notifications", icon: Bell },
  { label: "Feedback", path: "/admin/feedback", icon: MessageSquareCode },
  { label: "Audit Logs", path: "/admin/audit", icon: FileSpreadsheet },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute current breadcrumb
  const currentItem = SIDEBAR_ITEMS.find((item) => location.pathname.startsWith(item.path));
  const breadcrumb = currentItem ? currentItem.label : "Admin Control Panel";

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#07080A] text-neutral-200 font-sans antialiased">
      {/* ── Background Grid Accent (Tilted and Subtle) ── */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: "perspective(400px) rotateX(55deg) translateY(-20%) scale(1.5)",
          transformOrigin: "top center",
        }}
      />

      {/* ── 1. Admin Sidebar Navigation ── */}
      <aside
        style={{ width: collapsed ? 80 : 256 }}
        className="relative z-30 hidden shrink-0 flex-col border-r border-white/[0.08] bg-[#0B0C0E] transition-[width] duration-300 ease-in-out md:flex text-left h-screen overflow-hidden"
      >
        {/* Header Branding */}
        <div className={cn(
          "flex h-16 items-center shrink-0 border-b border-white/[0.08] px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                DevCanvas Admin
              </span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 border border-neutral-700 rounded px-1 py-0.5 bg-neutral-900 leading-none">
                OP
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-450 hover:text-white transition-all cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-none">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all group select-none",
                  isActive
                    ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30 text-orange-400 font-bold"
                    : "text-neutral-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-orange-400 animate-pulse" : "text-neutral-500"
                )} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/[0.08]">
          <Link
            to="/app"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-neutral-400 hover:bg-white/[0.04] hover:text-white transition-all select-none"
          >
            <Flame className="h-4 w-4 text-emerald-400 shrink-0" />
            {!collapsed && <span>Exit Operations</span>}
          </Link>
        </div>
      </aside>

      {/* ── 2. Main content area ── */}
      <div className="relative flex flex-1 flex-col overflow-hidden z-10">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#0B0C0E]/70 backdrop-blur-xl px-6">
          
          {/* Breadcrumbs & Search bar */}
          <div className="flex items-center gap-6">
            <span className="font-heading text-base font-bold text-white tracking-wide hidden sm:inline-block">
              {breadcrumb}
            </span>

            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search metrics, users, tickets..."
                className="h-9 w-64 lg:w-80 rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-white/30 outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.06] font-heading"
              />
            </div>
          </div>

          {/* Quick Actions (Theme, Notifications, Profile Dropdown) */}
          <div className="flex items-center gap-3.5">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications Panel */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white cursor-pointer relative"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-[#0B0C0E]/95 backdrop-blur-xl p-4 shadow-2xl z-50 text-left">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">System Alerts</span>
                    <button className="text-[10px] text-orange-400 hover:text-orange-300">Mark all read</button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-none">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-xs">
                      <p className="font-semibold text-white">Rate Limit Events Triggered</p>
                      <p className="text-[10.5px] text-neutral-400 mt-0.5">High traffic detected on analyze-security edge route.</p>
                      <span className="text-[9px] text-neutral-500 block mt-1.5">3 minutes ago</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all text-xs">
                      <p className="font-semibold text-white">Open Tickets Awaiting Support</p>
                      <p className="text-[10.5px] text-neutral-400 mt-0.5">2 critical database tickets created today.</p>
                      <span className="text-[9px] text-neutral-500 block mt-1.5">1 hour ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={userMenuRef} className="relative">
              <div
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pr-2.5 hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer select-none group"
              >
                <div className="relative p-[1.5px] rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shrink-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white uppercase border border-[#0B0C0E]">
                    {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "A"}
                  </div>
                </div>
                <div className="hidden lg:block leading-tight text-left">
                  <p className="text-xs font-heading font-bold text-white/90 truncate max-w-[100px]">
                    {profile?.full_name || "Admin"}
                  </p>
                  <p className="text-[10px] text-orange-400/80 font-semibold uppercase tracking-wider">
                    OPERATIONS
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white transition-colors ml-0.5" />
              </div>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#0B0C0E]/95 backdrop-blur-xl p-1 text-xs text-neutral-400 shadow-2xl z-50 text-left">
                  <Link
                    to="/admin/settings"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/[0.04] hover:text-white transition-all"
                  >
                    <Settings className="h-4 w-4 text-neutral-400" />
                    System Settings
                  </Link>
                  <button
                    onClick={() => navigate("/app")}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-white/[0.04] hover:text-white transition-all text-emerald-400"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Back to Workspace
                  </button>
                  <div className="my-1 border-t border-white/[0.08]" />
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate("/sign-in");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-danger-400 hover:bg-danger-500/10 transition-all font-semibold"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out Operations
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ── Scrollable Body Area ── */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
export default AdminLayout;
