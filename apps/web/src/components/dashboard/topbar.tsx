import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { Search, Bell, Menu, Plus, LogOut, LifeBuoy, Settings, Check, Sparkles, ChevronDown, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUIStore } from "@/lib/ui-store";
import logoImg from "../../logo.png";


interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

export function Topbar() {
  const { user, profile, signOut } = useAuth();
  const { setMobileSidebar } = useUIStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const techWords = ["Architect", "Engine", "Workspace", "Intelligence", "Analytics"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % techWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n1",
      title: "System Architecture Generated",
      desc: "AI completed microservice graph for AI Workspace",
      time: "10m ago",
      read: false,
    },
    {
      id: "n2",
      title: "Database Sync Complete",
      desc: "PostgreSQL schema migrations verified cleanly",
      time: "1h ago",
      read: false,
    },
    {
      id: "n3",
      title: "Security Check Passed",
      desc: "0 vulnerabilities found in API specs audit",
      time: "3h ago",
      read: true,
    },
  ]);

  const topbarRef = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const userInitial = profile?.full_name?.[0] || user?.email?.[0] || "Y";

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node) &&
        profileTriggerRef.current &&
        !profileTriggerRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // GSAP Topbar Entrance
  useEffect(() => {
    if (!topbarRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.fromTo(
      topbarRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.1 }
    );
  }, []);

  // Bell breathing animation
  useEffect(() => {
    if (!bellRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.to(bellRef.current, {
      scale: 1.06,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      tween.kill();
    };
  }, []);

  // Bell click burst / shake & toggle dropdown
  const handleBellClick = () => {
    if (bellRef.current) {
      gsap
        .timeline()
        .to(bellRef.current, { rotation: -15, scale: 1.2, duration: 0.1 })
        .to(bellRef.current, { rotation: 15, duration: 0.1 })
        .to(bellRef.current, { rotation: -10, duration: 0.1 })
        .to(bellRef.current, { rotation: 0, scale: 1, duration: 0.15, ease: "back.out(2)" });
    }
    setShowNotifications((prev) => !prev);
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header
      ref={topbarRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%), rgba(15, 15, 18, 0.35)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.25)",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
    >
      {/* ── Left Side: Mobile Menu Button + DevCanvas Branding ───── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebar(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white md:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
    to="/app"
    className="flex items-center gap-4 group"
>
          {/* Logo PNG image provided by the user */}
          <img
  src={logoImg}
  alt="DevCanvas"
  className="
    h-12
    md:h-[70px]
    w-auto
    object-contain
    shrink-0
    transition-transform
    duration-300
    group-hover:scale-105
  "
/>

          <span className="hidden sm:inline-block font-mono text-[9px] tracking-wider uppercase text-emerald-400/80 bg-emerald-950/30 border border-emerald-500/20 rounded px-1.5 py-0.5 select-none align-middle mt-0.5 min-w-[76px] text-center overflow-hidden">
            <span key={wordIndex} className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-350">
              {techWords[wordIndex]}
            </span>
          </span>
        </Link>
      </div>

      {/* ── Right Side: Search Bar -> New Project -> Help -> Settings -> Notifications -> Profile ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Search Bar shifted to right side before New Project */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, artifacts..."
            className="h-10 w-72 lg:w-96 rounded-xl border border-white/10 bg-black pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:w-[420px] focus:border-emerald-500/50 focus:bg-[#070709] focus:ring-2 focus:ring-emerald-500/20 font-heading"
          />
        </div>

        {/* 2. New Project CTA Button */}
        <button
          onClick={() => navigate("/app/projects?new=1")}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-heading font-bold text-white hover:border-white/20 hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-heading">New project</span>
        </button>

        {/* 5. Notification Bell with interactive dropdown */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={handleBellClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {showNotifications && (
            <div
              ref={notifDropdownRef}
              className="absolute right-0 mt-2 w-80 rounded-2xl border border-neutral-800 bg-[#121319] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-heading font-bold text-white uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((item) =>
                          item.id === n.id ? { ...item, read: true } : item
                        )
                      );
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      n.read
                        ? "border-neutral-850 bg-neutral-900/40 text-neutral-400"
                        : "border-emerald-500/20 bg-emerald-950/20 text-white font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate text-neutral-200">{n.title}</span>
                      <span className="text-[10px] text-neutral-500 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Profile Avatar & User Details */}
        <div className="relative">
          <div
            ref={profileTriggerRef as any}
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pr-2.5 hover:border-white/20 hover:bg-white/[0.07] transition-all cursor-pointer select-none group"
            title="User Profile"
          >
            <div className="relative p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-400 shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover border border-[#0B0C0E]"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white uppercase border border-[#0B0C0E]">
                  {userInitial}
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-[#0B0C0E]" />
            </div>
            <div className="hidden lg:block leading-tight text-left">
              <p className="text-xs font-heading font-bold text-white/90 truncate max-w-[120px]">
                {profile?.full_name || user?.email?.split("@")[0] || "Developer"}
              </p>
              <p className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                {user?.email || "yash@devcanvas.ai"}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-450 shrink-0 group-hover:text-white transition-colors ml-0.5" />
          </div>

          {/* Profile Dropdown Panel */}
          {showProfileMenu && (
            <div
              ref={profileDropdownRef}
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-800 bg-[#121319] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs text-neutral-300"
            >
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/app/settings");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-all text-left cursor-pointer"
              >
                <Settings className="h-4 w-4 text-neutral-400" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/app/support");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] hover:text-white transition-all text-left cursor-pointer"
              >
                <LifeBuoy className="h-4 w-4 text-neutral-400" />
                <span>Support & Help</span>
              </button>

              {profile?.role === "admin" && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/admin/dashboard");
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-orange-950/20 hover:text-orange-400 transition-all text-left font-medium cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 text-orange-400" />
                  <span>Admin Panel</span>
                </button>
              )}

              <div className="h-[1px] bg-neutral-800 my-1" />

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut();
                  navigate("/");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-950/20 hover:text-red-400 transition-all text-left font-medium cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-red-400/80" />
                <span className="text-red-400">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
