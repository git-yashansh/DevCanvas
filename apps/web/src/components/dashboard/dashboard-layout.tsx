import { Navigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useUIStore } from "@/lib/ui-store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { GraphiteAnimatedBackground } from "@/components/dashboard/graphite-animated-background";

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const { mobileSidebarOpen, setMobileSidebar } = useUIStore();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white/60" />
          <p className="text-sm font-medium text-white/30">Loading workspace…</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#09090B] text-neutral-200">
      {/* ── Neutral Graphite Animated GSAP Background (No Purple) ── */}
      <GraphiteAnimatedBackground />

      <Sidebar />
      {mobileSidebarOpen ? (
        <MobileSidebar onClose={() => setMobileSidebar(false)} />
      ) : null}
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
