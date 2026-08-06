import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  Send,
  Tag,
  MessageSquare,
  X,
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button, Input, Label, Badge } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@utils/index";
import type { DBTicket, DBTicketMessage } from "@/lib/types/tickets";
import {
  useUserTickets,
  useUserTicketMessages,
  useCreateTicket,
  useCreateTicketMessage,
  useUpdateTicket,
  useCreateNotification,
  useCreateNotificationsBulk,
  useCreateAuditLog,
} from "@/services/admin/hooks";

const schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  category: z.enum(["bug", "feature", "billing", "account", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(20, "Please describe your issue in at least 20 characters."),
});

type FormValues = z.infer<typeof schema>;

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug report",
  feature: "Feature request",
  billing: "Billing",
  account: "Account",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "warning" }> = {
  open: { label: "Open", variant: "warning" },
  in_progress: { label: "In Progress", variant: "default" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "default" },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-orange-400",
  critical: "text-rose-400 font-bold",
};

export function SupportPage() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // Selected ticket for Real-Time Chat Modal
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // React Query Hooks
  const { data: tickets = [], isLoading: loadingTickets, refetch: refetchTickets } = useUserTickets(user?.id ?? "");
  
  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const { data: messages = [], refetch: refetchMessages } = useUserTicketMessages(selectedTicket?.id ?? "");

  const { mutateAsync: createTicket } = useCreateTicket();
  const { mutateAsync: createMessage } = useCreateTicketMessage();
  const { mutateAsync: updateTicket } = useUpdateTicket();
  const { mutateAsync: createNotif } = useCreateNotification();
  const { mutateAsync: createBulkNotifs } = useCreateNotificationsBulk();
  const { mutateAsync: createAuditLog } = useCreateAuditLog();

  // Load user tickets & set up real-time listener
  useEffect(() => {
    if (!user) return;

    // Supabase Realtime channel for user's tickets updates
    const channel = supabase
      .channel(`user:tickets:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` },
        () => {
          refetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchTickets]);

  // Load chat messages when ticket selected & subscribe to Realtime
  useEffect(() => {
    if (!selectedTicketId) return;

    // Realtime channel for ticket replies
    const msgChannel = supabase
      .channel(`ticket_messages:${selectedTicketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${selectedTicketId}`,
        },
        () => {
          refetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [selectedTicketId, refetchMessages]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "bug", priority: "medium" },
  });

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setSubmitError(null);
    try {
      const ticketData = await createTicket({
        user_id: user.id,
        subject: values.subject,
        category: values.category,
        priority: values.priority,
        description: values.description,
      });

      // Fetch all admins and support staff to notify them in real-time
      const { data: staff } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "support"]);

      if (staff && staff.length > 0 && ticketData) {
        const notifInserts = staff.map((s) => ({
          user_id: s.id,
          recipient_user_id: s.id,
          title: "New Support Ticket",
          message: `User ${user.email} raised a new ticket: "${values.subject}"`,
          type: "info",
          created_by: user.id,
          sender_user_id: user.id,
          is_broadcast: false,
          is_read: false
        }));
        await createBulkNotifs(notifInserts);
      }

      await createAuditLog({
        actor_id: user.id,
        action: "Created Support Ticket",
        entity: `support_tickets (${ticketData.id})`,
        details: { ticket_number: ticketData.ticket_number, subject: ticketData.subject },
        result: "success",
      });

      setSubmitted(true);
      reset();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit support ticket.");
    }
  }

  // Handle user replying back in ticket conversation
  const handleUserReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !user || sendingReply) return;
    setSendingReply(true);
    const msgVal = replyMessage.trim();
    try {
      await createMessage({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        message: msgVal,
        is_internal: false,
      });

      setReplyMessage("");

      // Notify assigned admin, or all admins if unassigned
      const assignedAdminId = selectedTicket.assigned_admin;
      if (assignedAdminId) {
        await createNotif({
          user_id: assignedAdminId,
          recipient_user_id: assignedAdminId,
          title: "Ticket Chat Reply",
          message: `User replied to ticket #${selectedTicket.id.slice(0, 8).toUpperCase()}: "${msgVal.slice(0, 30)}..."`,
          type: "info",
          created_by: user.id,
          is_broadcast: false,
        });
      } else {
        const { data: staff } = await supabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "support"]);
        if (staff && staff.length > 0) {
          const inserts = staff.map((s) => ({
            user_id: s.id,
            recipient_user_id: s.id,
            title: "Ticket Chat Reply",
            message: `User replied to unassigned ticket #${selectedTicket.id.slice(0, 8).toUpperCase()}: "${msgVal.slice(0, 30)}..."`,
            type: "info",
            created_by: user.id,
            sender_user_id: user.id,
            is_broadcast: false,
            is_read: false
          }));
          await createBulkNotifs(inserts);
        }
      }

      await createAuditLog({
        actor_id: user.id,
        action: "Sent Support Ticket Message",
        entity: `support_tickets (${selectedTicket.id})`,
        details: { sender_role: "user" },
        result: "success",
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSendingReply(false);
    }
  };

  // Close ticket user action
  const handleCloseTicket = async (ticketId: string) => {
    try {
      await updateTicket({ id: ticketId, patch: { status: "closed" } });
      await createAuditLog({
        actor_id: user!.id,
        action: "Closed Support Ticket",
        entity: `support_tickets (${ticketId})`,
        result: "success",
      });
    } catch (err) {
      console.error("Failed to close ticket:", err);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-neutral-950 text-left px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-start items-center">
      {/* Premium Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Revolving Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 opacity-5 flex items-center justify-center border border-white/5 rounded-full"
        >
          <LifeBuoy className="h-8 w-8 text-neutral-600 absolute top-4 left-1/2 -translate-x-1/2" />
          <MessageSquare className="h-8 w-8 text-neutral-600 absolute bottom-4 left-1/2 -translate-x-1/2" />
          <ShieldCheck className="h-8 w-8 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
          <Clock className="h-8 w-8 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2" />
        </motion.div>
        
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] opacity-5 flex items-center justify-center border border-white/5 rounded-full"
        >
          <LifeBuoy className="h-10 w-10 text-neutral-600 absolute top-6 left-1/2 -translate-x-1/2" />
          <MessageSquare className="h-10 w-10 text-neutral-600 absolute bottom-6 left-1/2 -translate-x-1/2" />
          <ShieldCheck className="h-10 w-10 text-neutral-600 absolute left-6 top-1/2 -translate-y-1/2" />
          <Clock className="h-10 w-10 text-neutral-600 absolute right-6 top-1/2 -translate-y-1/2" />
        </motion.div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <PageHeader
          title="Support & Customer Care"
          description="Raise a technical query or track active responses from our engineering support team."
        />

      <div className="mt-8">
        <div className="flex gap-1 rounded-xl border border-white/10 bg-neutral-950 p-1 w-fit">
          {(["new", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold transition-all capitalize cursor-pointer",
                activeTab === tab
                  ? "bg-white/10 text-white border border-white/10 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {tab === "new" ? "Raise Support Ticket" : `My Tickets (${tickets.length})`}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === "new" ? (
              <motion.div
                key="new"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center"
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                      <CheckCircle className="h-7 w-7 text-emerald-400" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-white">Ticket Submitted Successfully!</h3>
                    <p className="mt-2 text-xs text-neutral-400">
                      Our support team will review your query and reply shortly in real time.
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSubmitted(false);
                          setActiveTab("history");
                        }}
                      >
                        View My Tickets
                      </Button>
                      <Button variant="gradient" onClick={() => setSubmitted(false)}>
                        Raise Another Ticket
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00e699]/10 text-[#00e699] border border-[#00e699]/20">
                        <LifeBuoy className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-heading text-base font-bold text-white">New Support Ticket</h2>
                        <p className="text-xs text-neutral-400">Average response time: under 1 hour</p>
                      </div>
                    </div>

                    {submitError && (
                      <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {submitError}
                      </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-neutral-300 text-xs font-semibold">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Brief summary of your technical query or issue..."
                          {...register("subject")}
                          className="bg-neutral-950 border-white/10 text-xs text-white"
                        />
                        {errors.subject && <p className="text-xs text-red-400">{errors.subject.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-neutral-300 text-xs font-semibold">Category</Label>
                          <div className="relative">
                            <select
                              id="category"
                              {...register("category")}
                              className="flex h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-950 px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                            >
                              <option value="bug">Bug report</option>
                              <option value="feature">Feature request</option>
                              <option value="billing">Billing & Subscription</option>
                              <option value="account">Account Access</option>
                              <option value="other">Other</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="priority" className="text-neutral-300 text-xs font-semibold">Priority Level</Label>
                          <div className="relative">
                            <select
                              id="priority"
                              {...register("priority")}
                              className="flex h-10 w-full appearance-none rounded-xl border border-white/10 bg-neutral-950 px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="critical">Critical Priority</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-neutral-300 text-xs font-semibold">Detailed Description</Label>
                        <textarea
                          id="description"
                          rows={5}
                          placeholder="Describe your issue in detail. Include steps to reproduce, expected behavior, or workspace errors..."
                          {...register("description")}
                          className="flex w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                        />
                        {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
                      </div>

                      <Button type="submit" variant="gradient" className="w-full text-xs font-bold" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-[#00e699]" />
                            Submitting Support Query...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Submit Support Ticket
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-[#00e699]" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
                    <LifeBuoy className="h-10 w-10 text-neutral-600" />
                    <p className="mt-4 text-sm font-bold text-white">No Tickets Raised Yet</p>
                    <p className="text-xs text-neutral-400 mt-1">Your submitted tickets will appear here with live updates.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => {
                      const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                      return (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 hover:border-white/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-neutral-500">{ticket.ticket_number || `#${ticket.id.slice(0, 8).toUpperCase()}`}</span>
                                <p className="font-bold text-sm text-white group-hover:text-[#00e699] transition-colors truncate">
                                  {ticket.subject}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                                <span className="flex items-center gap-1 text-neutral-400 font-medium">
                                  <Tag className="h-3 w-3 text-neutral-500" />
                                  {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                                </span>
                                <span className={cn("text-xs font-semibold capitalize", PRIORITY_COLORS[ticket.priority])}>
                                  {ticket.priority} Priority
                                </span>
                                <span className="flex items-center gap-1 text-neutral-500 font-mono text-[11px]">
                                  <Clock className="h-3 w-3" />
                                  {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={status.variant}>{status.label}</Badge>
                              <Button variant="ghost" size="sm" className="text-xs text-neutral-400 group-hover:text-white">
                                View Chat &rarr;
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      </div>

      {/* Ticket Real-Time Chat Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0B0C0E] text-white p-6 shadow-2xl flex flex-col h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-500">{selectedTicket.ticket_number || `#${selectedTicket.id.slice(0, 8).toUpperCase()}`}</span>
                  <Badge variant={STATUS_CONFIG[selectedTicket.status]?.variant || "default"}>
                    {STATUS_CONFIG[selectedTicket.status]?.label || selectedTicket.status}
                  </Badge>
                  <span className={cn("text-xs font-bold uppercase", PRIORITY_COLORS[selectedTicket.priority])}>
                    {selectedTicket.priority} Priority
                  </span>
                  {selectedTicket.assigned_admin_profile && (
                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-neutral-500" />
                      Assigned: {selectedTicket.assigned_admin_profile.full_name || selectedTicket.assigned_admin_profile.email}
                    </span>
                  )}
                </div>
                <h3 className="font-heading text-lg font-bold text-white">{selectedTicket.subject}</h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== "closed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                    className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Close Ticket
                  </Button>
                )}
                <button
                  onClick={() => setSelectedTicketId(null)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Original Ticket Description */}
            <div className="my-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02] text-xs text-neutral-300">
              <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-1">Issue Description</span>
              <p className="leading-relaxed font-sans">{selectedTicket.description}</p>
            </div>

            {/* Realtime Conversation Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 font-sans text-xs">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 font-mono">
                  No replies yet. Our support engineering team will respond here shortly.
                </div>
              ) : (
                messages.map((m) => {
                  const isUserMessage = m.sender_id === user?.id;
                  const senderName = m.sender?.full_name || (isUserMessage ? "You" : "Support Operator");
                  const isAdmin = m.sender?.role === "admin" || m.sender?.role === "support";

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[80%] rounded-2xl p-3.5 border text-xs leading-relaxed",
                        isUserMessage
                          ? "bg-[#00e699]/10 border-[#00e699]/20 text-white ml-auto"
                          : isAdmin
                            ? "bg-indigo-500/10 border-indigo-500/20 text-white mr-auto"
                            : "bg-white/[0.04] border-white/10 text-neutral-300"
                      )}
                    >
                      <div className="flex justify-between items-center gap-3 mb-1 border-b border-white/5 pb-1">
                        <span className={cn("font-bold text-[11px]", isUserMessage ? "text-[#00e699]" : "text-indigo-400")}>
                          {senderName} {isAdmin && "(Staff)"}
                        </span>
                        <span className="text-[9.5px] text-neutral-500 font-mono">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Form */}
            {selectedTicket.status !== "closed" ? (
              <div className="border-t border-white/10 pt-3 flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUserReply();
                  }}
                  placeholder="Type your reply here..."
                  className="flex-1 rounded-xl border border-white/10 bg-neutral-950 px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00e699]"
                />
                <Button
                  variant="gradient"
                  onClick={handleUserReply}
                  disabled={!replyMessage.trim() || sendingReply}
                  className="text-xs font-bold shrink-0"
                >
                  {sendingReply ? <Loader2 className="h-4 w-4 animate-spin text-[#00e699]" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-3 text-xs">
                <span className="text-neutral-500">This ticket has been marked as closed.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await updateTicket({ id: selectedTicket.id, patch: { status: "open", closed_at: null } });
                      await createAuditLog({
                        actor_id: user!.id,
                        action: "Ticket reopened",
                        entity: `support_tickets (${selectedTicket.id})`,
                        result: "success",
                      });
                    } catch (err) {
                      console.error("Failed to reopen ticket:", err);
                    }
                  }}
                  className="text-xs border-[#00e699]/30 text-[#00e699] hover:bg-[#00e699]/10"
                >
                  Reopen Ticket
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
