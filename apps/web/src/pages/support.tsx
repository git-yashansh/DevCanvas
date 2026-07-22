import { useState } from "react";
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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button, Input, Label, Badge } from "@ui/index";
import { supabase } from "@/lib/supabase";
import { cn } from "@utils/index";

const schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  category: z.enum(["bug", "feature", "billing", "account", "other"]),
  priority: z.enum(["low", "medium", "high"]),
  description: z.string().min(20, "Please describe your issue in at least 20 characters."),
});

type FormValues = z.infer<typeof schema>;

interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
}

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
  low: "text-success-400",
  medium: "text-warning-400",
  high: "text-danger-400",
};

export function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [ticketLoaded, setTicketLoaded] = useState(false);

  async function loadTickets() {
    if (ticketLoaded) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, category, priority, status, created_at")
      .order("created_at", { ascending: false });
    setTickets((data ?? []) as Ticket[]);
    setLoadingTickets(false);
    setTicketLoaded(true);
  }

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "bug", priority: "medium" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const { error } = await supabase.from("support_tickets").insert({
      subject: values.subject,
      category: values.category,
      priority: values.priority,
      description: values.description,
    });
    if (error) { setSubmitError(error.message); return; }
    setSubmitted(true);
    setTicketLoaded(false);
    reset();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Support"
        description="Raise a ticket and our team will respond within 24 hours."
      />

      <div className="mt-8">
        <div className="flex gap-1 rounded-xl border border-border bg-surface-2 p-1 w-fit">
          {(["new", "history"] as const).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "history") loadTickets(); }}
              className={cn("rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize",
                activeTab === tab ? "bg-primary-500/10 text-primary-300" : "text-neutral-400 hover:text-neutral-100")}>
              {tab === "new" ? "Raise a ticket" : "My tickets"}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeTab === "new" ? (
              <motion.div key="new" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {submitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-success-500/20 bg-success-500/5 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-500/10">
                      <CheckCircle className="h-7 w-7 text-success-400" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-neutral-50">Ticket submitted!</h3>
                    <p className="mt-2 text-sm text-neutral-400">We'll get back to you within 24 hours.</p>
                    <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
                      Raise another ticket
                    </Button>
                  </motion.div>
                ) : (
                  <div className="gradient-border rounded-2xl">
                    <div className="glass-strong rounded-2xl p-6 sm:p-8">
                      <div className="mb-6 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
                          <LifeBuoy className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="font-heading text-base font-semibold text-neutral-100">New support ticket</h2>
                          <p className="text-xs text-neutral-500">Average response time: under 24 hours</p>
                        </div>
                      </div>

                      {submitError ? (
                        <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
                          <AlertCircle className="h-4 w-4 shrink-0" />{submitError}
                        </div>
                      ) : null}

                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input id="subject" placeholder="Brief summary of your issue" {...register("subject")} />
                          {errors.subject ? <p className="text-xs text-danger-400">{errors.subject.message}</p> : null}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <div className="relative">
                              <select id="category" {...register("category")}
                                className="flex h-10 w-full appearance-none rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                <option value="bug">Bug report</option>
                                <option value="feature">Feature request</option>
                                <option value="billing">Billing</option>
                                <option value="account">Account</option>
                                <option value="other">Other</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <div className="relative">
                              <select id="priority" {...register("priority")}
                                className="flex h-10 w-full appearance-none rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <textarea id="description" rows={5}
                            placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and what you expected to happen."
                            {...register("description")}
                            className="flex w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                          {errors.description ? <p className="text-xs text-danger-400">{errors.description.message}</p> : null}
                        </div>

                        <Button type="submit" variant="gradient" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
                          ) : (
                            <><Send className="h-4 w-4" />Submit ticket</>
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                    <LifeBuoy className="h-10 w-10 text-neutral-700" />
                    <p className="mt-4 text-sm text-neutral-400">No tickets yet</p>
                    <p className="text-xs text-neutral-600">Your submitted tickets will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => {
                      const status = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                      return (
                        <div key={ticket.id} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-100 truncate">{ticket.subject}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1 text-xs text-neutral-500">
                                  <Tag className="h-3 w-3" />{CATEGORY_LABELS[ticket.category] ?? ticket.category}
                                </span>
                                <span className={cn("text-xs font-medium capitalize", PRIORITY_COLORS[ticket.priority])}>
                                  {ticket.priority} priority
                                </span>
                                <span className="flex items-center gap-1 text-xs text-neutral-600">
                                  <Clock className="h-3 w-3" />
                                  {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
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
  );
}
