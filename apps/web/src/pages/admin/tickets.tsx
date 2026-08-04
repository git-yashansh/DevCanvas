import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ArrowRight,
  Send,
  Plus,
  Loader2,
  Trash2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Badge, Button } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/index";
import type { DBTicket, DBTicketMessage } from "@/lib/types/tickets";

export function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<DBTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<DBTicket | null>(null);

  const [messages, setMessages] = useState<DBTicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Load tickets & subscribe to Realtime updates
  async function loadTickets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          id,
          user_id,
          subject,
          category,
          priority,
          status,
          description,
          created_at,
          updated_at,
          profiles:user_id (id, full_name, email, avatar_url, role)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data as any[]) || []);
    } catch (err) {
      console.error("Failed to load admin tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();

    // Supabase Realtime for admin tickets
    const channel = supabase
      .channel("admin:support_tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newTicket = payload.new as DBTicket;
            // Fetch profile for new ticket
            const { data: prof } = await supabase
              .from("profiles")
              .select("id, full_name, email, avatar_url, role")
              .eq("id", newTicket.user_id)
              .maybeSingle();

            setTickets((prev) => [{ ...newTicket, profiles: prof || undefined }, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DBTicket;
            setTickets((prev) =>
              prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
            );
            if (selectedTicket?.id === updated.id) {
              setSelectedTicket((prev) => (prev ? { ...prev, ...updated } : null));
            }
          } else if (payload.eventType === "DELETE") {
            setTickets((prev) => prev.filter((t) => t.id !== payload.old.id));
            if (selectedTicket?.id === payload.old.id) {
              setSelectedTicket(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  // Load messages & Realtime subscription when ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      return;
    }

    async function loadTicketMessages() {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("ticket_messages")
          .select(`
            id,
            ticket_id,
            sender_id,
            message,
            is_internal,
            created_at,
            sender:sender_id (id, full_name, email, avatar_url, role)
          `)
          .eq("ticket_id", selectedTicket!.id)
          .order("created_at", { ascending: true });

        if (!error && data) {
          setMessages(data as any[]);
        }
      } catch (err) {
        console.error("Failed to load ticket messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    }

    loadTicketMessages();

    // Supabase Realtime subscription for ticket messages
    const channel = supabase
      .channel(`admin:messages:${selectedTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${selectedTicket.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as DBTicketMessage;
          const { data: prof } = await supabase
            .from("profiles")
            .select("id, full_name, email, avatar_url, role")
            .eq("id", newMsg.sender_id)
            .maybeSingle();

          setMessages((prev) => [
            ...prev.filter((m) => m.id !== newMsg.id),
            { ...newMsg, sender: prof || undefined },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id]);

  // Send Public Reply
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !user) return;
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: replyText.trim(),
        is_internal: false,
      });

      if (!error) {
        setReplyText("");
        // Auto update status to in_progress if open
        if (selectedTicket.status === "open") {
          await supabase
            .from("support_tickets")
            .update({ status: "in_progress" })
            .eq("id", selectedTicket.id);
        }
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  // Send Internal Note
  const handleSendInternalNote = async () => {
    if (!internalNoteText.trim() || !selectedTicket || !user) return;
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: internalNoteText.trim(),
        is_internal: true,
      });

      if (!error) {
        setInternalNoteText("");
      }
    } catch (err) {
      console.error("Failed to post internal note:", err);
    }
  };

  // Update Status
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket || !user) return;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", selectedTicket.id);

      if (!error) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus as any } : null));
      }
    } catch (err) {
      console.error("Failed to change status:", err);
    }
  };

  // Update Priority
  const handleUpdatePriority = async (newPriority: string) => {
    if (!selectedTicket || !user) return;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ priority: newPriority })
        .eq("id", selectedTicket.id);

      if (!error) {
        setSelectedTicket((prev) => (prev ? { ...prev, priority: newPriority as any } : null));
      }
    } catch (err) {
      console.error("Failed to change priority:", err);
    }
  };

  // Delete Ticket Action
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await supabase.from("support_tickets").delete().eq("id", ticketId);
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to delete ticket:", err);
    }
  };

  // Filtered Tickets Computation
  const filteredTickets = tickets.filter((t) => {
    const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 lg:p-10 space-y-6 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          SaaS Operations Support Desk
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Real-time ticket queue, priority escalation management, and customer correspondence telemetry.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0B0C0E]/60 border border-white/[0.08] p-3 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by subject, user email, or ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white outline-none focus:border-orange-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="critical">Critical Priority</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Tickets List (4 cols) */}
        <div className="lg:col-span-4 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-4 space-y-3 h-[72vh] overflow-y-auto">
          <div className="flex justify-between items-center px-1">
            <span className="font-heading text-xs font-bold text-white uppercase tracking-wider">
              Support Queue ({filteredTickets.length})
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
              <span className="text-xs text-neutral-500 font-mono">Loading ticket queue...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-500 font-mono">
              No matching tickets found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((t) => {
                const profileObj = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                const reporterName = profileObj?.full_name || profileObj?.email || "User";

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2",
                      selectedTicket?.id === t.id
                        ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-[9.5px] text-neutral-500">#{t.id.slice(0, 8).toUpperCase()}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9.5px] uppercase font-bold px-1.5 py-0.5",
                          t.priority === "critical"
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-400 font-black"
                            : t.priority === "high"
                              ? "bg-red-500/15 border-red-500/20 text-red-400"
                              : "bg-neutral-800 border-neutral-700 text-neutral-400"
                        )}
                      >
                        {t.priority}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-xs text-white line-clamp-1 leading-snug">{t.subject}</h4>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 border-t border-white/[0.03] pt-2">
                      <span className="truncate max-w-[120px]">{reporterName}</span>
                      <span className="font-mono text-[9px] text-neutral-500">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Conversation / Details Pane (8 cols) */}
        <div className="lg:col-span-8 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 h-[72vh] flex flex-col justify-between overflow-hidden">
          {selectedTicket ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              {/* Ticket Meta & Quick Actions */}
              <div className="border-b border-white/[0.08] pb-3.5 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-left space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-500">#{selectedTicket.id.slice(0, 8).toUpperCase()}</span>
                    <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                  <h3 className="font-heading text-base font-bold text-white leading-tight">
                    {selectedTicket.subject}
                  </h3>
                  {(() => {
                    const profileObj = Array.isArray(selectedTicket.profiles)
                      ? selectedTicket.profiles[0]
                      : selectedTicket.profiles;
                    return (
                      <p className="text-xs text-neutral-400">
                        Reporter: <span className="text-neutral-300 font-semibold">{profileObj?.full_name || "User"}</span> ({profileObj?.email || "n/a"})
                      </p>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority Select */}
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                    className="bg-neutral-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>

                  {/* Status Select */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="bg-neutral-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="p-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete Ticket"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none py-2 text-left font-sans text-xs">
                {/* Description */}
                <div className="bg-[#121319]/80 p-3.5 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400 block">Initial Issue Ticket Prompt</span>
                  <p className="text-neutral-300 leading-relaxed font-sans">{selectedTicket.description}</p>
                </div>

                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const senderObj = (m as any).sender || (Array.isArray((m as any).profiles) ? (m as any).profiles[0] : (m as any).profiles);
                    const senderName = senderObj?.full_name || (m.sender_id === user?.id ? "You" : "User");
                    const isAdminSender = senderObj?.role === "admin" || senderObj?.role === "support";

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "max-w-[85%] rounded-2xl p-3 border text-xs leading-relaxed font-sans",
                          m.is_internal
                            ? "bg-amber-500/10 border-amber-500/20 text-white"
                            : isAdminSender
                              ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/20 ml-auto"
                              : "bg-[#121319] border-white/10 text-neutral-300"
                        )}
                      >
                        <div className="flex justify-between items-center gap-4 mb-1 border-b border-white/5 pb-1">
                          <span
                            className={cn(
                              "font-bold text-[11px]",
                              m.is_internal ? "text-amber-400" : isAdminSender ? "text-orange-400" : "text-white"
                            )}
                          >
                            {m.is_internal ? `[INTERNAL OPERATOR NOTE] ${senderName}` : senderName}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-neutral-200 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply / Internal Note Inputs */}
              <div className="border-t border-white/[0.08] pt-3.5 mt-2 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-neutral-400 font-bold block">Public Reply to User</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendReply();
                        }}
                        placeholder="Write public reply..."
                        className="flex-1 h-9 rounded-xl border border-white/10 bg-neutral-950 px-3 text-xs text-white outline-none focus:border-orange-500/50"
                      />
                      <button
                        onClick={handleSendReply}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-all shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-amber-400 font-bold block">Internal Operator Note</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendInternalNote();
                        }}
                        placeholder="Write private operator notes..."
                        className="flex-1 h-9 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={handleSendInternalNote}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-all shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500 gap-2">
              <MessageSquare className="h-10 w-10 text-neutral-600 animate-pulse" />
              <p className="text-sm font-bold text-white">Select a Support Ticket</p>
              <p className="text-xs text-neutral-400 max-w-xs">
                Review user correspondence, reply in real time, or record private operator notes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTicketsPage;
