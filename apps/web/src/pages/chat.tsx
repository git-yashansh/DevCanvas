import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  MessageSquare,
  Search,
  Plus,
  Pin,
  Bookmark,
  Send,
  Loader2,
  Trash2,
  AlertCircle,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  GitBranch,
  FileText,
  Rocket,
  Info,
  CheckCircle2,
  Clock,
  ChevronRight,
  User,
  Settings,
  HelpCircle,
  Copy,
  Check,
  BookOpen,
  CornerDownLeft,
  Search as SearchIcon,
  Maximize2,
  Sliders,
  Terminal,
  Zap,
} from "lucide-react";
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@ui/index";
import { useProjects, useProject } from "@/lib/queries/projects";
import { useChatMessages, useSendMessage, useDeleteChatMessages, chatKeys } from "@/lib/queries/chat";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@utils/index";

type ContextType = "all" | "architecture" | "database" | "api" | "security" | "repo" | "docs" | "deploy";

const CONTEXT_SWITCHES = [
  { id: "all",          label: "Entire Project", icon: Sparkles,    color: "text-indigo-400" },
  { id: "architecture", label: "Architecture",   icon: Boxes,       color: "text-indigo-400" },
  { id: "database",     label: "Database",       icon: Database,    color: "text-violet-400" },
  { id: "api",          label: "API Spec",       icon: Code2,       color: "text-sky-400" },
  { id: "security",     label: "Security",       icon: ShieldCheck, color: "text-emerald-400" },
  { id: "repo",         label: "Repository",     icon: GitBranch,   color: "text-amber-400" },
  { id: "docs",         label: "Documentation",  icon: FileText,    color: "text-pink-400" },
  { id: "deploy",       label: "Deployment",     icon: Rocket,      color: "text-orange-400" },
];

const QUICK_ACTIONS = [
  { text: "Explain Architecture", cmd: "/explain architecture" },
  { text: "Optimize Database Schema", cmd: "/database optimize" },
  { text: "Review Security Vulnerabilities", cmd: "/security review" },
  { text: "Generate API Specification", cmd: "/api generate" },
  { text: "Show CI/CD Pipeline", cmd: "/deployment pipeline" },
];

const SUGGESTIONS = [
  "How do I configure composite index settings?",
  "What is the system design topology?",
  "List any OWASP threat vector updates.",
  "Show Dockerfile configuration.",
];

// Rich Markdown/Code parser inside chat window
function RichChatMessage({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const parts = useMemo(() => {
    const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
    const items = [];
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        items.push({ type: "text", content: text.substring(lastIndex, match.index) });
      }
      items.push({ type: "code", language: match[1] || "plaintext", content: match[2] });
      lastIndex = codeRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      items.push({ type: "text", content: text.substring(lastIndex) });
    }

    return items;
  }, [text]);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-3.5 leading-relaxed text-sm">
      {parts.map((p, idx) => {
        if (p.type === "code") {
          return (
            <div key={idx} className="my-3 overflow-hidden rounded-xl border border-white/10 bg-neutral-950">
              <div className="flex items-center justify-between border-b border-white/5 bg-neutral-900/50 px-4 py-2 font-mono text-xs text-neutral-400">
                <span className="uppercase font-bold tracking-wider">{p.language}</span>
                <button
                  onClick={() => handleCopy(p.content, idx)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-xs font-mono text-neutral-200 text-left leading-normal select-text">
                <code>{p.content}</code>
              </pre>
            </div>
          );
        }

        // Basic formatting replacements (bold, inline code, list items)
        const formattedText = p.content
          .split("\n")
          .map((line, lIdx) => {
            let processed = line;
            // List item check
            const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
            if (isBullet) {
              processed = line.replace(/^[\*\-]\s+/, "");
            }

            // Bold styling
            processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
            // Inline code
            processed = processed.replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs text-emerald-300">$1</code>');

            return isBullet ? (
              <li key={lIdx} className="list-disc ml-5 pl-1 text-neutral-200 my-1 text-sm" dangerouslySetInnerHTML={{ __html: processed }} />
            ) : (
              <p key={lIdx} className="my-1.5 text-neutral-200 min-h-[1em] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />
            );
          });

        return <div key={idx} className="space-y-1.5 text-left font-sans">{formattedText}</div>;
      })}
    </div>
  );
}

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContext, setSelectedContext] = useState<ContextType>("all");

  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingStep, setThinkingStep] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedProjectId = searchParams.get("projectId") || (projects && projects.length > 0 ? projects[0].id : null);
  const { data: project } = useProject(selectedProjectId ?? undefined);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedProjectId ?? undefined);

  const sendMessage = useSendMessage();
  const deleteMessages = useDeleteChatMessages();

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Search filter
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  // Overall Score Calculation
  const overallScore = useMemo(() => {
    if (!project) return 0;
    let score = 70;
    if (project.architecture) score += 8;
    if (project.database_schema) score += 7;
    if (project.api_spec) score += 8;
    if (project.security_report) score += 7;
    return Math.min(98, score);
  }, [project]);

  // Auto-resize prompt input box
  const handleInputChange = (val: string) => {
    setInput(val);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(160, inputRef.current.scrollHeight)}px`;
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isGenerating || !selectedProjectId) return;

    setError(null);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setIsGenerating(true);

    // Simulated step-by-step thinking list
    const steps = [
      "Understanding Project Context...",
      "Reading Architecture Specifications...",
      "Reviewing Database Schema Integrity...",
      "Analyzing Codebase Dependencies...",
      "Generating Intelligent Reply...",
    ];

    let stepIdx = 0;
    setThinkingStep(steps[0]);
    const thinkingInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setThinkingStep(steps[stepIdx]);
      }
    }, 1200);

    try {
      await sendMessage.mutateAsync({ projectId: selectedProjectId, content });

      const rawHistory = messages ?? [];
      const formattedHistory: { role: "user" | "assistant"; content: string }[] = [];

      rawHistory.forEach((msg) => {
        if (msg.role === "system") return;
        
        const lastMsg = formattedHistory[formattedHistory.length - 1];
        if (lastMsg && lastMsg.role === msg.role) {
          lastMsg.content += "\n" + msg.content;
        } else {
          formattedHistory.push({ role: msg.role as any, content: msg.content });
        }
      });

      const lastMsg = formattedHistory[formattedHistory.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        lastMsg.content += "\n" + content;
      } else {
        formattedHistory.push({ role: "user", content });
      }

      // Add context metadata mapping
      const contextPrefix = `[Scope: ${selectedContext.toUpperCase()}] `;
      if (formattedHistory.length > 0) {
        formattedHistory[formattedHistory.length - 1].content = contextPrefix + formattedHistory[formattedHistory.length - 1].content;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ messages: formattedHistory }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.reply) throw new Error("No response returned from Gemini.");

      await supabase.from("chat_messages").insert({
        project_id: selectedProjectId,
        role: "assistant",
        content: data.reply,
      });

      await queryClient.invalidateQueries({ queryKey: chatKeys.messages(selectedProjectId) });
    } catch (err: any) {
      setError(err.message || "Failed to fetch response.");
    } finally {
      clearInterval(thinkingInterval);
      setIsGenerating(false);
      setThinkingStep("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectProject = (pId: string) => {
    setSearchParams({ projectId: pId });
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-[#09090B] text-neutral-200">
      {/* ── PANEL 1: LEFT CONVERSATION SIDEBAR ────────────────── */}
      <aside className="w-64 border-r border-white/[0.08] bg-neutral-950/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <span className="font-heading text-xs font-bold uppercase tracking-wider text-neutral-300">Workspace AI</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/projects?new=1")}
            className="h-7 w-7 p-0 hover:bg-white/10"
            title="Create New Project Thread"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.04]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/10 bg-neutral-900/60 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Sidebar Project Threads List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 sidebar-scroll">
          <div className="px-2 py-1.5 flex items-center gap-1.5 text-xs font-bold text-neutral-400 uppercase tracking-wider">
            <Pin className="h-3.5 w-3.5" /> Pinned Workspace Threads
          </div>
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProject(p.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-all font-semibold",
                selectedProjectId === p.id
                  ? "bg-white/[0.07] text-white border border-white/15 shadow-sm"
                  : "text-neutral-300 hover:bg-white/[0.02] hover:text-white"
              )}
            >
              <MessageSquare className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate flex-1 font-semibold">{p.name}</span>
              <Bookmark className="h-3.5 w-3.5 text-neutral-500 hover:text-white" />
            </button>
          ))}
          {filteredProjects.length === 0 && (
            <p className="text-xs text-neutral-500 px-3 py-2 italic">No threads found.</p>
          )}
        </div>
      </aside>

      {/* ── PANEL 2: CENTER CHAT CONTAINER ───────────────────── */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative">
        {/* Top Context Switching bar */}
        <div className="h-13 border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0 bg-neutral-950/45">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full sidebar-scroll pt-1">
            <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider mr-2 shrink-0">Focus Context:</span>
            {CONTEXT_SWITCHES.map((sw) => (
              <button
                key={sw.id}
                onClick={() => setSelectedContext(sw.id as ContextType)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0",
                  selectedContext === sw.id
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-bold"
                    : "border-white/5 bg-white/[0.01] text-neutral-300 hover:border-white/15 hover:text-white"
                )}
              >
                <sw.icon className={cn("h-4 w-4", sw.color)} />
                <span>{sw.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Stream thread panel */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 sidebar-scroll">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="h-9 w-9 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-sans text-xl font-bold text-white tracking-normal">Project Assistant Workspace</h4>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Ask Workspace AI anything about the active specs. You can reference specific artifacts by typing <strong className="text-emerald-400">@Architecture</strong> or <strong className="text-emerald-400">@Database</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 w-full pt-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs font-medium text-neutral-300 hover:border-white/20 hover:text-white transition-all leading-normal"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, i) => {
                const isSystem = msg.role === "system";
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-neutral-900/60 text-xs font-medium text-neutral-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 text-sm max-w-4xl",
                      isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 text-white font-bold select-none text-xs",
                      isAssistant
                        ? "bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 border-emerald-500/30"
                        : "bg-neutral-800 border-white/10"
                    )}>
                      {isAssistant ? "AI" : <User className="h-4.5 w-4.5" />}
                    </div>

                    <div className="space-y-1.5 max-w-[calc(100%-48px)]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-200 text-xs">
                          {isAssistant ? "Workspace AI" : "Lead Architect"}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">
                          {formatRelative(msg.created_at)}
                        </span>
                      </div>
                      <div className={cn(
                        "rounded-2xl border p-4.5 shadow-xl select-text leading-relaxed font-sans text-sm",
                        isAssistant
                          ? "border-white/10 bg-neutral-950/70 text-neutral-200"
                          : "border-emerald-500/30 bg-emerald-500/10 text-white"
                      )}>
                        {isAssistant ? <RichChatMessage text={msg.content} /> : <p className="text-left font-sans text-sm leading-relaxed">{msg.content}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Thinking / Loader state */}
          {isGenerating && (
            <div className="flex gap-3 mr-auto max-w-3xl">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
              </div>
              <div className="space-y-1.5">
                <span className="font-bold text-neutral-200 text-xs block text-left">Workspace AI is thinking</span>
                <div className="rounded-xl border border-white/10 bg-neutral-950/60 p-3.5 flex items-center gap-2">
                  <span className="text-sm text-neutral-300 font-mono animate-pulse">{thinkingStep || "Processing..."}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-danger-500/20 bg-danger-500/5 px-4 py-3 text-sm text-danger-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-white/[0.08] bg-neutral-950/45 shrink-0 space-y-3">
          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-2 overflow-x-auto max-w-full sidebar-scroll pb-1">
            {QUICK_ACTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.cmd)}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold text-neutral-300 hover:border-white/20 hover:text-white transition-all shrink-0"
              >
                {chip.text}
              </button>
            ))}
          </div>

          {/* Textarea prompt area */}
          <div className="gradient-border rounded-xl">
            <div className="bg-neutral-900 rounded-xl p-3 flex items-end gap-3 text-left">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Workspace AI... Try mentioning @Architecture or @Database to target context"
                rows={1}
                className="flex-1 max-h-40 min-h-[40px] bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none pt-2 px-2 leading-relaxed font-sans"
              />
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMessages.mutate(selectedProjectId!)}
                  disabled={!messages || messages.length === 0 || deleteMessages.isPending}
                  className="h-9 w-9 p-0 text-neutral-400 hover:text-white"
                  title="Clear Conversation Logs"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isGenerating}
                  className="h-9 px-4 text-sm font-semibold flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PANEL 3: RIGHT PROJECT LIVE CONTEXT PANEL ───────── */}
      <aside className="w-72 border-l border-white/[0.08] bg-neutral-950/40 p-4 space-y-6 shrink-0 flex flex-col overflow-y-auto sidebar-scroll text-left">
        {project ? (
          <>
            {/* Project name & info card */}
            <div className="space-y-2 pb-4 border-b border-white/5">
              <span className="text-xs uppercase font-extrabold text-neutral-400 tracking-wider">Current Project</span>
              <h4 className="font-heading text-base font-bold text-white tracking-tight">{project.name}</h4>
              <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed font-sans">{project.description}</p>
            </div>

            {/* AI Engineering Score */}
            <div className="space-y-2 pb-4 border-b border-white/5">
              <div className="flex justify-between items-center text-xs uppercase font-bold text-neutral-400 tracking-wider">
                <span>Engineering Score</span>
                <span className="text-emerald-400 font-mono text-sm font-bold">{overallScore}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700",
                    overallScore >= 80 ? "bg-emerald-500" : overallScore >= 60 ? "bg-amber-500" : "bg-danger-500"
                  )}
                  style={{ width: `${overallScore}%` }}
                />
              </div>
              <span className="text-xs text-neutral-400 block leading-normal">Score calculated dynamically from generated specifications.</span>
            </div>

            {/* Generated Status Tree */}
            <div className="space-y-3 pb-4 border-b border-white/5">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider block">Generated Artifacts</span>
              <div className="space-y-2 text-sm">
                {[
                  { label: "System Architecture", has: !!project.architecture },
                  { label: "PostgreSQL Database Schema", has: !!project.database_schema },
                  { label: "API OpenAPI Specification", has: !!project.api_spec },
                  { label: "Security & OWASP Audit", has: !!project.security_report },
                  { label: "Documentation Suite", has: !!project.documentation },
                  { label: "Deployment CI/CD Targets", has: !!project.deployment_plan },
                ].map((art) => (
                  <div key={art.label} className="flex items-center justify-between text-xs text-neutral-300 font-medium">
                    <span className="truncate">{art.label}</span>
                    {art.has ? (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0.5 select-none font-bold">Generated</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 text-neutral-400 select-none">Pending</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Referenced Files list */}
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider block">Referenced Files in Chat</span>
              <div className="space-y-1.5">
                {[
                  { name: "App.tsx", path: "src/App.tsx", icon: Boxes },
                  { name: "schema.sql", path: "supabase/migrations/schema.sql", icon: Database },
                  { name: "apiClient.ts", path: "src/api/apiClient.ts", icon: Code2 },
                ].map((file) => (
                  <div key={file.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.01] px-3 py-2 text-xs text-neutral-300">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <file.icon className="h-4 w-4 text-neutral-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold block truncate text-xs leading-tight">{file.name}</span>
                        <span className="text-[10px] text-neutral-500 block truncate">{file.path}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-neutral-500 italic py-6">Select a project thread to load blueprint context.</p>
        )}
      </aside>
    </div>
  );
}

function formatRelative(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (_) {
    return dateStr;
  }
}
