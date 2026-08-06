import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Settings,
  HardDrive,
  Cpu,
  Ticket,
  Clock,
  Shield,
  Activity,
  Award,
  Bell,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge, Button } from "@ui/index";
import { cn } from "@utils/index";
import type { DBTicket } from "@/lib/types/tickets";
import type { DBNotification } from "@/lib/types/notifications";
import { useAdminUserDetails, useUpdateUserStatus } from "@/services/admin/hooks";

export function AdminUserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: userDetails, isLoading: loading } = useAdminUserDetails(id ?? "");
  const { mutateAsync: updateStatus } = useUpdateUserStatus();

  const profile = userDetails?.profile;
  const tickets = userDetails?.tickets || [];
  const notifications = userDetails?.notifications || [];
  const projectsCount = userDetails?.projectsCount || 0;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id) return;
    try {
      await updateStatus({ userId: id, status: newStatus });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        <span className="text-xs text-neutral-500 font-mono">Loading user audit details...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-10 text-center space-y-4">
        <p className="text-white text-base font-bold">User profile not found.</p>
        <Button onClick={() => navigate("/admin/users")} variant="outline">
          Back to User Operations
        </Button>
      </div>
    );
  }

  const userStatus = profile.status || "active";

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-5xl mx-auto font-sans">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-5">
        <button
          onClick={() => navigate("/admin/users")}
          className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            User Audit &amp; Activity Profile
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Analyzing operational statistics, profile parameters, tickets history, and notification logs for {profile.full_name || profile.email}.
          </p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Profile Info */}
        <div className="bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col items-center justify-center text-center p-3">
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shrink-0 mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-2xl font-black text-white uppercase border-2 border-[#0B0C0E]">
                {profile.full_name?.charAt(0) || profile.email?.charAt(0) || "U"}
              </div>
            </div>
            <h2 className="font-heading text-lg font-bold text-white">{profile.full_name || "SaaS User"}</h2>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">{profile.email}</p>
            <div className="flex gap-2.5 mt-3">
              <Badge variant="outline" className="text-[10px] uppercase font-bold bg-orange-500/10 border-orange-500/20 text-orange-400">
                {profile.role}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] uppercase font-bold",
                  userStatus === "active"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : userStatus === "suspended"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}
              >
                {userStatus}
              </Badge>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-white/[0.08] pt-4 text-xs font-sans">
            <div className="flex justify-between">
              <span className="text-neutral-500">Joined Date:</span>
              <span className="font-semibold text-white font-mono">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Last Active Seen:</span>
              <span className="font-semibold text-white font-mono">
                {profile.last_seen ? new Date(profile.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}
              </span>
            </div>
          </div>
        </div>

        {/* Resources Metrics */}
        <div className="md:col-span-2 bg-gradient-to-b from-[#0a142c]/40 via-[#121319] to-[#121319] border border-blue-900/25 rounded-2xl p-5 space-y-5">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Resource &amp; Activity Summary
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0B0C0E]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Users className="h-4 w-4 text-orange-400" />
                <span className="text-[10.5px] uppercase font-bold tracking-wider">Projects</span>
              </div>
              <p className="text-lg font-heading font-black text-white">{projectsCount}</p>
              <span className="text-[9.5px] text-neutral-500 block">Workspaces owned</span>
            </div>

            <div className="bg-[#0B0C0E]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Ticket className="h-4 w-4 text-cyan-400" />
                <span className="text-[10.5px] uppercase font-bold tracking-wider">Support Desk</span>
              </div>
              <p className="text-lg font-heading font-black text-white">{tickets.length}</p>
              <span className="text-[9.5px] text-neutral-500 block">
                {tickets.filter((t) => t.status === "open").length} open queries
              </span>
            </div>

            <div className="bg-[#0B0C0E]/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Bell className="h-4 w-4 text-purple-400" />
                <span className="text-[10.5px] uppercase font-bold tracking-wider">Notifications</span>
              </div>
              <p className="text-lg font-heading font-black text-white">{notifications.length}</p>
              <span className="text-[9.5px] text-neutral-500 block">Delivered history</span>
            </div>
          </div>

          {/* Quick Account Controls */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs gap-3">
            <span className="text-neutral-500 font-medium">Modify Status State:</span>
            <div className="flex items-center gap-2">
              {userStatus !== "active" && (
                <button
                  onClick={() => handleUpdateStatus("active")}
                  className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Reactivate Account
                </button>
              )}
              {userStatus !== "suspended" && (
                <button
                  onClick={() => handleUpdateStatus("suspended")}
                  className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Suspend Account
                </button>
              )}
              {userStatus !== "banned" && (
                <button
                  onClick={() => handleUpdateStatus("banned")}
                  className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl transition-all cursor-pointer"
                >
                  Ban User
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tickets & Notifications Audit Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support tickets list */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            User Support Tickets ({tickets.length})
          </span>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {tickets.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 font-mono text-center">No support tickets submitted.</p>
            ) : (
              tickets.map((tk) => (
                <div key={tk.id} className="flex justify-between items-start text-xs border-b border-white/[0.03] pb-3 last:border-b-0">
                  <div className="space-y-1">
                    <p className="font-semibold text-white leading-normal">{tk.subject}</p>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                      <span>{new Date(tk.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{tk.priority} priority</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9.5px] uppercase font-bold">
                    {tk.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications list */}
        <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
          <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
            Target Notification Logs ({notifications.length})
          </span>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 font-mono text-center">No notifications delivered.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex justify-between items-start text-xs border-b border-white/[0.03] pb-3 last:border-b-0">
                  <div className="space-y-1">
                    <p className="font-semibold text-white leading-normal">{n.title}</p>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">{n.message}</p>
                  </div>
                  <span className="text-[9.5px] text-neutral-500 font-mono shrink-0 ml-2">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUserDetailsPage;
