import { useState, useEffect } from "react";
import { Bell, Send, CheckCircle, Trash2, Megaphone, Clock, Info, Users, User, Edit2, Loader2, AlertTriangle } from "lucide-react";
import { Badge, Button } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/index";
import type { DBNotification, NotificationType } from "@/lib/types/notifications";

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
}

export function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [mode, setMode] = useState<"broadcast" | "personal">("broadcast");
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState<NotificationType>("info");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load notifications & user list
  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch notifications
      const { data: notifData, error: notifErr } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (notifErr) throw notifErr;
      setNotifications(notifData || []);

      // 2. Fetch profiles for personal notification user picker
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("email", { ascending: true });

      setUserOptions(profilesData || []);
    } catch (err) {
      console.error("Failed to load admin notifications data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Supabase Realtime subscription for admin notifications list
    const channel = supabase
      .channel("admin:notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as DBNotification;
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DBNotification;
            setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        const { error } = await supabase
          .from("notifications")
          .update({
            title: title.trim(),
            message: message.trim(),
            type: notifType,
            is_broadcast: mode === "broadcast",
            user_id: mode === "personal" ? targetUserId : null,
          })
          .eq("id", editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        // Create new notification
        const { error } = await supabase.from("notifications").insert({
          title: title.trim(),
          message: message.trim(),
          type: notifType,
          created_by: user.id,
          is_broadcast: mode === "broadcast",
          user_id: mode === "personal" ? targetUserId : null,
          is_read: false,
        });

        if (error) throw error;
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
      await supabase.from("notifications").delete().eq("id", id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const TYPE_BADGE: Record<NotificationType, string> = {
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
                <label className="text-neutral-300 font-semibold">Select Target User</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#00e699]"
                >
                  <option value="">-- Choose User Profile --</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                    </option>
                  ))}
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
              {notifications.map((n) => {
                const targetUser = userOptions.find((u) => u.id === n.user_id);
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
