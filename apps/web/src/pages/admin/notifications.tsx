import { useState, useEffect } from "react";
import { Bell, Send, CheckCircle, Trash2, Megaphone, Clock, Info, Users, User, Edit2, Loader2, AlertTriangle } from "lucide-react";
import { Badge, Button } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/index";
import type { DBNotification, NotificationType } from "@/lib/types/notifications";
import {
  useAdminNotifications,
  useAdminUserOptions,
  useCreateNotification,
  useCreateNotificationsBulk,
  useUpdateNotification,
  useDeleteNotification,
} from "@/services/admin/hooks";
import { NotificationService } from "@/services/admin/notifications";

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

export function AdminNotificationsPage() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [mode, setMode] = useState<"broadcast" | "personal">("broadcast");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState<NotificationType>("info");
  const [editingId, setEditingId] = useState<string | null>(null);

  // React Query hooks
  const { data: notifications = [], isLoading: loadingNotifs, refetch } = useAdminNotifications();
  const { data: userOptions = [], isLoading: loadingUsers } = useAdminUserOptions();
  const { mutateAsync: createNotif } = useCreateNotification();
  const { mutateAsync: createBulk } = useCreateNotificationsBulk();
  const { mutateAsync: updateNotif } = useUpdateNotification();
  const { mutateAsync: deleteNotif } = useDeleteNotification();

  const loading = loadingNotifs || loadingUsers;

  useEffect(() => {
    const channel = supabase
      .channel("admin:notifications:realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleSubmitNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !user) return;
    if (mode === "personal" && !targetUserId) {
      alert("Please select a target user for personal notification.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing notification
        await updateNotif({
          id: editingId,
          patch: {
            title: title.trim(),
            message: message.trim(),
            type: notifType,
            is_broadcast: mode === "broadcast",
            user_id: mode === "personal" && !targetUserId.startsWith("role:") ? targetUserId : null,
          }
        });
        setEditingId(null);
      } else {
        // Create new notification(s)
        if (mode === "broadcast") {
          // ALL USERS: Fetch all profiles and insert individual records
          const profilesRes = await NotificationService.getUserOptions();
          if (profilesRes && profilesRes.length > 0) {
            const inserts = profilesRes.map((u: any) => ({
              title: title.trim(),
              message: message.trim(),
              type: notifType,
              created_by: user.id,
              sender_user_id: user.id,
              is_broadcast: true,
              user_id: u.id,
              recipient_user_id: u.id,
              is_read: false,
            }));
            await createBulk(inserts);
          }
        } else if (mode === "personal" && targetUserId.startsWith("role:")) {
          // ROLE: Fetch profiles matching role and insert
          const targetRole = targetUserId.split(":")[1];
          const profilesRes = await NotificationService.getUserOptions();
          // Filter on client or do a db call. Standard is client filter if options already loaded
          const filtered = profilesRes.filter((p: any) => {
            // we don't have role in userOptions query, so we query role users if needed or check.
            // Wait, does userOptions returned profiles have role? Let's check:
            // "select("id, email, full_name")" - it doesn't have role!
            // So we need to query role users:
            return true;
          });
          // Wait, let's fetch matching profiles from database to be absolutely correct
          const { data: roleUsers } = await supabase
            .from("profiles")
            .select("id")
            .eq("role", targetRole);

          if (roleUsers && roleUsers.length > 0) {
            const inserts = roleUsers.map((u) => ({
              title: title.trim(),
              message: message.trim(),
              type: notifType,
              created_by: user.id,
              sender_user_id: user.id,
              is_broadcast: false,
              user_id: u.id,
              recipient_user_id: u.id,
              is_read: false,
            }));
            await createBulk(inserts);
          }
        } else {
          // SPECIFIC USER: Single insert
          await createNotif({
            title: title.trim(),
            message: message.trim(),
            type: notifType,
            created_by: user.id,
            is_broadcast: false,
            user_id: targetUserId,
            recipient_user_id: targetUserId,
          });
        }
      }

      setTitle("");
      setMessage("");
      setTargetUserId("");
    } catch (err) {
      console.error("Failed to save notification:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (notif: DBNotification) => {
    setEditingId(notif.id);
    setTitle(notif.title);
    setMessage(notif.message);
    setNotifType(notif.type);
    setMode(notif.is_broadcast ? "broadcast" : "personal");
    setTargetUserId(notif.user_id || "");
  };

  const handleDeleteNotif = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await deleteNotif(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const TYPE_BADGE: Record<string, string> = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          Real-Time Notifications Control Center
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Publish global broadcast notices or trigger personal user alerts backed by Supabase Realtime telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Notification Creator (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B0C0E]/60 border border-white/[0.08] rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#00e699]" />
              {editingId ? "Edit Notification" : "Publish Notification"}
            </span>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setTitle("");
                  setMessage("");
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitNotif} className="space-y-4 text-xs">
            {/* Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold">Notification Scope</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setMode("broadcast")}
                  className={cn(
                    "py-1.5 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5",
                    mode === "broadcast"
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  <Users className="h-3.5 w-3.5" />
                  Global Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => setMode("personal")}
                  className={cn(
                    "py-1.5 rounded-lg font-bold transition-all text-xs flex items-center justify-center gap-1.5",
                    mode === "personal"
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  <User className="h-3.5 w-3.5" />
                  Specific User
                </button>
              </div>
            </div>

            {/* Target User (If Personal) */}
            {mode === "personal" && (
              <div className="space-y-1.5">
                <label className="text-neutral-300 font-semibold">Select Target User or Role</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#00e699]"
                >
                  <option value="">-- Choose Recipient Scope --</option>
                  <optgroup label="All Users with Role">
                    <option value="role:admin">All Administrators</option>
                    <option value="role:user">All Regular Users</option>
                    <option value="role:support">All Support Operators</option>
                    <option value="role:moderator">All Moderators</option>
                  </optgroup>
                  <optgroup label="Specific User Profile">
                    {userOptions.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Notification Type */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold">Severity / Type</label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as NotificationType)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#00e699]"
              >
                <option value="info">Info (Informational Notice)</option>
                <option value="success">Success (Completion / Rewards)</option>
                <option value="warning">Warning (Maintenance / Caution)</option>
                <option value="error">Error (System Critical Outage)</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheduled Maintenance Alert..."
                className="w-full rounded-xl border border-white/10 bg-neutral-950 px-3.5 py-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#00e699]"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-neutral-300 font-semibold">Message Description</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide detailed description of the alert or notification message..."
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-neutral-950 p-3 text-xs text-white outline-none focus:ring-1 focus:ring-[#00e699] resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="w-full text-xs font-bold"
              disabled={submitting || !title.trim() || !message.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#00e699]" />
                  Saving Notification...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {editingId ? "Update Notification" : "Publish Realtime Notification"}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Right List: Active Notifications Stream (7 cols) */}
        <div className="lg:col-span-7 bg-[#0B0C0E]/60 border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
            <span className="font-heading text-sm font-bold text-white">
              Live Notifications History ({notifications.length})
            </span>
            <span className="text-[10.5px] text-neutral-400 font-mono">Realtime Live Sync</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#00e699]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-500 font-mono">
              No notifications published yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              {notifications.map((n: any) => {
                const targetUser = userOptions.find((u: any) => u.id === n.user_id);
                const recipientLabel = n.is_broadcast
                  ? "Global Broadcast (All Users)"
                  : targetUser
                    ? `User: ${targetUser.full_name || targetUser.email}`
                    : `User: #${n.user_id?.slice(0, 8)}`;

                return (
                  <div
                    key={n.id}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2.5 transition-all hover:border-white/20"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[9.5px] uppercase font-bold px-2 py-0.5", TYPE_BADGE[n.type])}>
                            {n.type}
                          </Badge>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {n.is_broadcast ? "📢 Broadcast" : "👤 Personal"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-white">{n.title}</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditClick(n)}
                          className="p-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white transition-colors"
                          title="Edit Notification"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNotif(n.id)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete Notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">{n.message}</p>

                    <div className="flex justify-between items-center text-[10.5px] text-neutral-500 border-t border-white/5 pt-2">
                      <span>Target: <strong className="text-neutral-300 font-normal">{recipientLabel}</strong></span>
                      <span className="font-mono">
                        {new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminNotificationsPage;
