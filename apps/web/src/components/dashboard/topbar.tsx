import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import gsap from "gsap";
import { Search, Bell, Menu, Plus, LogOut, LifeBuoy, Settings, Check, Sparkles, ChevronDown, ShieldCheck, Bot, GitBranch, FileText, Boxes, Database, Code2, BookOpen, Users, HelpCircle, MessageSquare, Home, LayoutDashboard, Server, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUIStore } from "@/lib/ui-store";
import { cn } from "@utils/index";
import logoImg from "../../logo.png";
import { useSearchTrie } from "@/hooks/useSearchTrie";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

const getSearchIcon = (iconName: string) => {
  const map: Record<string, any> = {
    Home,
    LayoutDashboard,
    MessageSquare,
    Boxes,
    Database,
    Code2,
    FileText,
    Server,
    ShieldCheck,
    GitBranch,
    Settings,
    LifeBuoy
  };
  return map[iconName] || Search;
};

export function Topbar() {
  const { user, profile, signOut } = useAuth();
  const { toggleSidebar, setMobileSidebar } = useUIStore();
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    hasMore,
    loadMore,
  } = useRealtimeNotifications();

  const [search, setSearch] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"products" | "resources" | "company" | null>(null);

  // Trie-based fast search engine
  const { getSuggestions } = useSearchTrie();
  const searchSuggestions = useMemo(() => {
    return getSuggestions(search);
  }, [getSuggestions, search]);

  const [wordIndex, setWordIndex] = useState(0);
  const techWords = ["Architect", "Engine", "Workspace", "Intelligence", "Analytics"];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % techWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const topbarRef = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileTriggerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchSuggestions(false);
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

  return (
    <header
      ref={topbarRef}
      onMouseLeave={() => setActiveMenu(null)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "#050505",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.02), 0 4px 20px rgba(0, 0, 0, 0.25)",
        transform: "translateZ(0)",
        willChange: "transform",
      }}
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
    >
      {/* ── Left Side: Mobile Menu Button + DevCanvas Branding ───── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebar(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/[0.05] hover:text-white md:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link
    to="/app"
    className="flex items-center gap-4 group"
>
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

      {/* ── Middle: Products, Resources, Company Mega Menus ── */}
      <div className="hidden lg:flex items-center gap-10 text-sm font-heading font-medium text-neutral-400 h-full">
        <div
          className="relative h-full flex items-center"
          onMouseEnter={() => setActiveMenu("products")}
        >
          <button className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors h-full cursor-pointer outline-none border-none",
            activeMenu === "products" ? "text-emerald-400" : "text-neutral-400 hover:text-white"
          )}>
            Products
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", activeMenu === "products" && "rotate-180")} />
          </button>
        </div>

        <div
          className="relative h-full flex items-center"
          onMouseEnter={() => setActiveMenu("resources")}
        >
          <button className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors h-full cursor-pointer outline-none border-none",
            activeMenu === "resources" ? "text-indigo-400" : "text-neutral-400 hover:text-white"
          )}>
            Resources
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", activeMenu === "resources" && "rotate-180")} />
          </button>
        </div>

        <div
          className="relative h-full flex items-center"
          onMouseEnter={() => setActiveMenu("company")}
        >
          <button className={cn(
            "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors h-full cursor-pointer outline-none border-none",
            activeMenu === "company" ? "text-amber-400" : "text-neutral-400 hover:text-white"
          )}>
            Company
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", activeMenu === "company" && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* ── Right Side: Search Bar -> New Project -> Help -> Settings -> Notifications -> Profile ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. Search Bar shifted to right side before New Project */}
        <div className="relative hidden md:block" ref={searchContainerRef}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/50" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSearchSuggestions(true);
            }}
            onFocus={() => setShowSearchSuggestions(true)}
            placeholder="Search projects, artifacts..."
            className="h-9 w-40 lg:w-52 rounded-xl border border-white/[0.06] bg-[#0A0A0A] pl-8 pr-3 text-xs text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:w-60 focus:border-white/20 focus:bg-black focus:ring-2 focus:ring-white/[0.03] font-heading"
          />

          {/* Autocomplete Suggestions powered by Trie */}
          {showSearchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              <div className="px-2.5 py-1.5 border-b border-white/[0.04] text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                Suggestions ({searchSuggestions.length})
              </div>
              <div className="mt-1.5 space-y-0.5 max-h-64 overflow-y-auto">
                {searchSuggestions.map((item) => {
                  const Icon = getSearchIcon(item.iconName);
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setShowSearchSuggestions(false);
                        setSearch("");
                        navigate(item.path);
                      }}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/[0.05] transition-all text-left group cursor-pointer"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.02] border border-white/[0.05] text-neutral-400 group-hover:text-white group-hover:bg-white/[0.05] transition-colors shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{item.title}</span>
                          <span className="text-[9px] text-neutral-400 font-medium px-1.5 py-0.5 rounded-full border border-white/[0.05] bg-white/[0.01] uppercase tracking-wider shrink-0 ml-2">{item.category}</span>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-neutral-450 truncate mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. New Project CTA Button */}
        <button
          onClick={() => navigate("/app/projects?new=1")}
          className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs font-heading font-bold text-white hover:border-white/15 hover:bg-white/[0.05] active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline font-heading">New project</span>
        </button>

        {/* 5. Notification Bell with interactive dropdown */}
        <div className="relative">
          <button
            ref={bellRef}
            onClick={handleBellClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/60 transition-colors hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
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
              className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
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
                    onClick={() => markAllAsRead()}
                    className="text-[10px] text-neutral-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3 w-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-center text-xs text-neutral-500 py-4">No notifications yet</p>
                ) : (
                  <>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all relative group/notif ${
                          n.is_read
                            ? "border-white/[0.06] bg-white/[0.02] text-neutral-400"
                            : "border-emerald-500/20 bg-emerald-950/20 text-white font-medium"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate text-neutral-200 pr-4">{n.title}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-neutral-500">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="p-1 text-neutral-500 hover:text-rose-400 rounded opacity-0 group-hover/notif:opacity-100 transition-opacity cursor-pointer animate-in fade-in"
                              title="Delete notification"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 pr-2 line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                    {hasMore && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadMore();
                        }}
                        className="w-full text-center py-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer border border-dashed border-white/5 rounded-xl hover:bg-white/5"
                      >
                        Load More Notifications
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6. Profile Avatar & User Details */}
        <div className="relative">
          <div
            ref={profileTriggerRef as any}
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 pr-2.5 hover:border-white/15 hover:bg-white/[0.05] transition-all cursor-pointer select-none group"
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
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-white/[0.06] bg-[#0A0A0A] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-xs text-neutral-300"
            >
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/app/settings");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all text-left cursor-pointer"
              >
                <Settings className="h-4 w-4 text-neutral-400" />
                <span>Settings</span>
              </button>
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/app/support");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] hover:text-white transition-all text-left cursor-pointer"
              >
                <LifeBuoy className="h-4 w-4 text-neutral-400" />
                <span>Support & Help</span>
              </button>

              {(profile?.role === "admin" || user?.email?.toLowerCase() === "kr.yashansh123@gmail.com") && (
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

              <div className="h-[1px] bg-white/[0.06] my-1" />

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
      {/* Backdrop blur overlay */}
      {activeMenu && (
        <div
          className="fixed inset-x-0 bottom-0 bg-[#050505]/40 backdrop-blur-md z-30 transition-all duration-300 pointer-events-auto"
          style={{ top: "4rem" }}
          onMouseEnter={() => setActiveMenu(null)}
        />
      )}

      {/* Mega Menu Dropdowns */}
      {activeMenu && (
        <div
          className="mega-menu absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[calc(100vw-2rem)] max-w-6xl z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div
            className="rounded-[24px] border border-white/[0.08] p-5.5 flex gap-6 text-left items-stretch shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]"
            style={{
              backgroundColor: "#08090C",
              color: "#E2E8F0",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Left section: 28% width */}
            <div className="w-[28%] flex flex-col gap-6 select-none shrink-0 pr-4">
              {/* Banner card */}
              <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-900 to-purple-800 p-4 text-white shadow-sm min-h-[110px] flex flex-col justify-end">
                {/* Abstract colorful background details */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/30 rounded-full blur-xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 rounded-full blur-lg pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="font-sans text-[15px] font-medium text-white tracking-normal">
                    {activeMenu === "products" && "Platform Overview"}
                    {activeMenu === "resources" && "Learning Center"}
                    {activeMenu === "company" && "Company Portal"}
                  </h3>
                  <p className="text-[13px] text-white/80 mt-1 leading-normal font-normal font-sans">
                    {activeMenu === "products" && "See how DevCanvas works."}
                    {activeMenu === "resources" && "Guides, APIs, and articles."}
                    {activeMenu === "company" && "Our mission to optimize code."}
                  </p>
                </div>
              </div>

              {/* Links list */}
              <div className="flex flex-col gap-3 pl-1">
                {activeMenu === "products" && (
                  <>
                    <Link to="/app/repo" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-emerald-400 transition-colors font-sans">
                      <GitBranch className="h-4 w-4 text-neutral-500" />
                      Connectors &amp; Actions
                    </Link>
                    <Link to="/app/api-generator" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-emerald-400 transition-colors font-sans">
                      <Code2 className="h-4 w-4 text-neutral-500" />
                      APIs Spec Manager
                    </Link>
                    <Link to="/app/architecture" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-emerald-400 transition-colors font-sans">
                      <Boxes className="h-4 w-4 text-neutral-500" />
                      Model Grapher Hub
                    </Link>
                    <Link to="/app/chat" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-emerald-400 transition-colors font-sans">
                      <Bot className="h-4 w-4 text-neutral-500" />
                      AI Gateway Assistant
                    </Link>
                    <Link to="/app/security" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-emerald-400 transition-colors font-sans">
                      <ShieldCheck className="h-4 w-4 text-neutral-500" />
                      Security Checkup
                    </Link>
                  </>
                )}

                {activeMenu === "resources" && (
                  <>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-indigo-400 transition-colors font-sans">
                      <BookOpen className="h-4 w-4 text-neutral-500" />
                      Core Documentation
                    </a>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-indigo-400 transition-colors font-sans">
                      <Code2 className="h-4 w-4 text-neutral-500" />
                      SDK Github Repos
                    </a>
                    <a href="https://discord.com" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-indigo-400 transition-colors font-sans">
                      <Users className="h-4 w-4 text-neutral-500" />
                      Discord Lounge
                    </a>
                  </>
                )}

                {activeMenu === "company" && (
                  <>
                    <Link to="/app/support" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-amber-400 transition-colors font-sans">
                      <Users className="h-4 w-4 text-neutral-500" />
                      Meet Our Team
                    </Link>
                    <Link to="/app/security" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-amber-400 transition-colors font-sans">
                      <ShieldCheck className="h-4 w-4 text-neutral-500" />
                      Security Posture
                    </Link>
                    <Link to="/app/support" className="flex items-center gap-2.5 text-[13px] font-normal text-neutral-300 hover:text-amber-400 transition-colors font-sans">
                      <HelpCircle className="h-4 w-4 text-neutral-500" />
                      SOC2 Compliance
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right section (Dark card): 72% width */}
            <div className="flex-1 bg-white/[0.02] border border-white/[0.08] rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden text-neutral-200">
              <div className="p-5.5 grid grid-cols-3 gap-6">
                {activeMenu === "products" && (
                  <>
                    {/* Col 1 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Bot className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">DevCanvas Assistant</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Your personal AI builder</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/chat" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Proactive Suggestions</Link>
                        <Link to="/app/architecture" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Architecture Verification</Link>
                        <Link to="/app/database" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Database Schema Optimizer</Link>
                        <Link to="/app/chat" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Logic Code Generation</Link>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">DevCanvas Agents</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Build and orchestrate blueprints</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/database" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Schema Architect</Link>
                        <Link to="/app/api-generator" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Route Spec Optimizer</Link>
                        <Link to="/app/security" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Security Policy Builder</Link>
                        <Link to="/app/deployment" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Docker Compose Specs</Link>
                      </div>
                    </div>

                    {/* Col 3 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Boxes className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">Enterprise Context</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Context for it all</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/workspace" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Global Search Specs</Link>
                        <Link to="/app/architecture" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Interactive Simulations</Link>
                        <Link to="/app/repo" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Live Execution Trace</Link>
                        <Link to="/app/architecture" className="block text-[13px] font-normal text-neutral-400 hover:text-emerald-400 transition-colors font-sans">Cost Estimation Reports</Link>
                      </div>
                    </div>
                  </>
                )}

                {activeMenu === "resources" && (
                  <>
                    {/* Col 1 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <BookOpen className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">Documentation</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Complete manuals &amp; guides</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans">Getting Started Guide</a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans">CLI Integration Guide</a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans">Deployment Playbooks</a>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Boxes className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">Integrations</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Connect your workflows</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans">GitHub Actions Setup</a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans">GitLab CI Templates</a>
                        <a href="https://github.com" target="_blank" rel="noreferrer" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans">Slack Webhooks Setup</a>
                      </div>
                    </div>

                    {/* Col 3 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <HelpCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">Support &amp; Learning</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">We are here to help</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans font-sans">Interactive Tutorials</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans font-sans">Video Walkthroughs</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-indigo-500 transition-colors font-sans font-sans">Help Support Desk</Link>
                      </div>
                    </div>
                  </>
                )}

                {activeMenu === "company" && (
                  <>
                    {/* Col 1 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">About DevCanvas</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Empowering developers</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Our Mission &amp; Values</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Leadership Team</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Press &amp; Media Kit</Link>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Bot className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">Careers</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Shape future of AI engineering</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Open Positions</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Working Culture</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Internships Program</Link>
                      </div>
                    </div>

                    {/* Col 3 */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/[0.06]">
                        <Settings className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[15px] font-medium text-white leading-none font-sans tracking-normal">Legal &amp; Terms</h4>
                          <span className="text-[13px] text-neutral-400 mt-1.5 block leading-normal font-sans">Policies and trust details</span>
                        </div>
                      </div>
                      <div className="space-y-3 pl-1">
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Privacy Policy</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Terms of Service</Link>
                        <Link to="/app/support" className="block text-[13px] font-normal text-neutral-400 hover:text-amber-500 transition-colors font-sans">Security Overview</Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer bar */}
              <div className="bg-white/[0.04] border-t border-white/[0.06] px-5.5 py-3.5 flex items-center justify-between text-xs text-neutral-400">
                {activeMenu === "products" && (
                  <Link to="/app/workspace" className="flex items-center gap-1.5 font-semibold text-neutral-200 hover:text-emerald-400 transition-colors font-sans">
                    <Plus className="h-4 w-4 text-neutral-500" />
                    Install DevCanvas CLI &amp; API Plugins &rarr;
                  </Link>
                )}
                {activeMenu === "resources" && (
                  <a href="https://discord.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-semibold text-neutral-200 hover:text-indigo-500 transition-colors font-sans font-sans">
                    <MessageSquare className="h-4 w-4 text-neutral-500" />
                    Join our Discord developer community lounge &rarr;
                  </a>
                )}
                {activeMenu === "company" && (
                  <Link to="/app/support" className="flex items-center gap-1.5 font-semibold text-neutral-200 hover:text-amber-400 transition-colors font-sans">
                    <Check className="h-4 w-4 text-neutral-500" />
                    Check our real-time system operations status page &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
