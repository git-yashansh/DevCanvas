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
} from "lucide-react";
import { Badge } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/index";


export function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [replyText, setReplyText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");

  // Load tickets
  async function loadTickets() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          id,
          subject,
          category,
          priority,
          status,
          description,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (data) {
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load messages for a ticket
  async function loadMessages(ticketId: string) {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select(`
          id,
          message,
          is_internal,
          created_at,
          sender_id,
          profiles:sender_id (
            full_name,
            email,
            role
          )
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  // Reply handler
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket || !user) return;
    try {
      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: replyText,
          is_internal: false,
        });

      if (!error) {
        setReplyText("");
        loadMessages(selectedTicket.id);
        
        // Log admin audit action
        await supabase.from("audit_logs").insert({
          actor_id: user.id,
          action: "Support Reply Sent",
          entity: `support_tickets (${selectedTicket.id})`,
          result: "success",
        });
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    }
  };

  // Internal Note handler
  const handleSendInternalNote = async () => {
    if (!internalNoteText.trim() || !selectedTicket || !user) return;
    try {
      const { error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          message: internalNoteText,
          is_internal: true,
        });

      if (!error) {
        setInternalNoteText("");
        loadMessages(selectedTicket.id);
      }
    } catch (err) {
      console.error("Failed to post note:", err);
    }
  };

  // Change ticket status handler
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket || !user) return;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: newStatus })
        .eq("id", selectedTicket.id);

      if (!error) {
        setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
        loadTickets();
        
        // Log admin audit action
        await supabase.from("audit_logs").insert({
          actor_id: user.id,
          action: `Ticket Status Updated: ${newStatus.toUpperCase()}`,
          entity: `support_tickets (${selectedTicket.id})`,
          result: "success",
        });
      }
    } catch (err) {
      console.error("Failed to change status:", err);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          SaaS Operations Support Desk
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Review support queries, route issues to target engineering teams, manage priorities, and response timeline histories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Tickets List */}
        <div className="lg:col-span-1 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-4 space-y-4 h-[75vh] overflow-y-auto scrollbar-none">
          <span className="font-heading text-sm font-bold text-white block">
            Support Queue
          </span>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
              <span className="text-xs text-neutral-500 font-mono">Loading active tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 text-xs text-neutral-500 font-mono">
              No tickets raised yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tickets.map((t) => {
                const profileObj = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
                const reporterName = profileObj?.full_name || "User";
                
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-2 ${
                      selectedTicket?.id === t.id
                        ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.05)]"
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-[10px] text-neutral-500">#{t.id.slice(0, 8).toUpperCase()}</span>
                      <Badge variant="outline" className={`text-[9.5px] uppercase font-bold ${
                        t.priority === "critical" || t.priority === "high" ? "bg-red-500/15 border-red-500/20 text-red-400" :
                        "bg-neutral-800 border-neutral-700 text-neutral-400"
                      }`}>
                        {t.priority}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-[13px] text-white line-clamp-1 leading-snug">{t.subject}</h4>
                    <div className="flex justify-between items-center text-[10.5px] text-neutral-450 border-t border-white/[0.03] pt-2 mt-1">
                      <span>{reporterName}</span>
                      <span className="font-mono text-[9.5px] text-neutral-500">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Conversation / Ticket Details */}
        <div className="lg:col-span-2 bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 h-[75vh] flex flex-col justify-between overflow-hidden">
          {selectedTicket ? (
            <div className="flex flex-col h-full justify-between overflow-hidden">
              
              {/* Ticket Top Meta */}
              <div className="border-b border-white/[0.08] pb-3.5 mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-left space-y-1">
                  <h3 className="font-heading text-base font-bold text-white leading-tight">
                    {selectedTicket.subject}
                  </h3>
                  {(() => {
                    const profileObj = Array.isArray(selectedTicket.profiles) ? selectedTicket.profiles[0] : selectedTicket.profiles;
                    return (
                      <p className="text-xs text-neutral-400">
                        Reporter: <span className="text-neutral-300 font-semibold">{profileObj?.full_name || "User"}</span> ({profileObj?.email || "n/a"})
                      </p>
                    );
                  })()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{selectedTicket.category}</Badge>
                  
                  {/* Status Dropdown control for admin */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Message Streams (Conversation + Internal Notes tabs) */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 scrollbar-none py-2 text-left">
                {/* Description of ticket */}
                <div className="bg-[#121319]/80 p-3.5 rounded-xl border border-white/10 text-xs text-left space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">Ticket Description</span>
                  <p className="text-neutral-250 leading-relaxed font-sans">{selectedTicket.description}</p>
                </div>

                {loadingMessages ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
                  </div>
                ) : (
                  messages.map((m) => {
                    const senderObj = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                    const senderName = senderObj?.full_name || (m.sender_id === user?.id ? "You" : "Operator");
                    const isAdminSender = senderObj?.role === "admin" || senderObj?.role === "support";
                    
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "max-w-[85%] rounded-xl p-3 border text-xs leading-relaxed font-sans",
                          m.is_internal 
                            ? "bg-amber-500/5 border-amber-500/20"
                            : isAdminSender
                              ? "bg-gradient-to-r from-orange-500/5 to-pink-500/5 border-orange-500/10 ml-auto"
                              : "bg-[#121319] border-white/5"
                        )}
                      >
                        <div className="flex justify-between items-center gap-4 mb-1 border-b border-white/[0.03] pb-1">
                          <span className={cn(
                            "font-bold",
                            m.is_internal ? "text-amber-400" : isAdminSender ? "text-orange-400" : "text-white"
                          )}>
                            {m.is_internal ? `[INTERNAL NOTE] ${senderName}` : senderName}
                          </span>
                          <span className="text-[9px] text-neutral-500 font-mono">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-neutral-300 whitespace-pre-wrap">{m.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply inputs */}
              <div className="border-t border-white/[0.08] pt-4 mt-3.5 space-y-3">
                {/* Tabs to switch public reply / internal note */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-neutral-450 font-bold block mb-1">Public Reply to User</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write correspondence reply to user..."
                        className="flex-1 h-9 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white outline-none focus:border-orange-500/50"
                      />
                      <button
                        onClick={handleSendReply}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-all"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">Internal Operator Note</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={internalNoteText}
                        onChange={(e) => setInternalNoteText(e.target.value)}
                        placeholder="Write log notes (private to admins)..."
                        className="flex-1 h-9 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={handleSendInternalNote}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-all"
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
              <p className="text-sm font-semibold">Select a support ticket from queue</p>
              <p className="text-xs text-neutral-600 max-w-xs">Audit active logs, correspondence histories, and internal notes here.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
export default AdminTicketsPage;
