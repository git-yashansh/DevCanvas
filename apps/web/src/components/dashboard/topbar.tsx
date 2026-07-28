import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Search, Bell, Menu, Plus, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUIStore } from "@/lib/ui-store";
import { Avatar, AvatarFallback, Button } from "@ui/index";
import { initials } from "@utils/index";

export function Topbar() {
  const { profile, signOut } = useAuth();
  const { setMobileSidebar } = useUIStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const topbarRef = useRef<HTMLElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Bell click burst / shake
  const handleBellClick = () => {
    if (!bellRef.current) return;
    gsap.timeline()
      .to(bellRef.current, { rotation: -15, scale: 1.2, duration: 0.1 })
      .to(bellRef.current, { rotation: 15, duration: 0.1 })
      .to(bellRef.current, { rotation: -10, duration: 0.1 })
      .to(bellRef.current, { rotation: 0, scale: 1, duration: 0.15, ease: "back.out(2)" });
  };

  return (
    <header
      ref={topbarRef}
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 -1px 0 rgba(255, 255, 255, 0.05)",
      }}
      className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 px-4 sm:px-6"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebar(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 hover:bg-white/10 hover:text-white md:hidden transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* ── Search Bar with Expand & Glow on Focus ──────────── */}
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-indigo-400" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, artifacts…"
            className="h-9 w-72 rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-white/90 placeholder:text-white/30 outline-none transition-all duration-300 focus:w-80 focus:border-indigo-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* ── New Project CTA Button with Sheen Sweep & Press Scale ─ */}
        <button
          onClick={() => navigate("/app/projects/new")}
          className="sheen-btn flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New project</span>
        </button>

        {/* ── Notification Bell with Idle Pulse ──────────────── */}
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/50 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-[#0A0A0F]" />
        </button>

        {/* ── User Avatar & Info ──────────────────────────────── */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pr-3">
          <Avatar className="h-7 w-7 border border-white/20">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-xs font-semibold text-indigo-200">
              {initials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block leading-tight">
            <p className="text-xs font-semibold text-white/90">
              {profile?.full_name ?? "User"}
            </p>
            <p className="text-[10px] text-white/40">{profile?.email}</p>
          </div>
        </div>

        {/* ── Sign Out ────────────────────────────────────────── */}
        <button
          onClick={() => {
            signOut();
            navigate("/");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/40 transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
