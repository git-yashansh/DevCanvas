import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
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
import type { ChatMessage } from "@types-pkg/index";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@utils/index";
import { AIOrb } from "@/components/dashboard/AIOrb";

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

const GENERAL_SUGGESTIONS = [
  "Explain the difference between SQL and NoSQL databases",
  "Write a clean implementation of binary search in TypeScript",
  "Help me prepare for a frontend engineering system design interview",
  "What are the best practices for structuring a React component folder?",
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

  const formatInline = (str: string) => {
    let processed = str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Bold styling with medium/semibold weight instead of harsh bold
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-neutral-100 font-semibold">$1</strong>');
    
    // Inline code styling
    processed = processed.replace(/`(.*?)`/g, '<code class="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded font-mono text-[11.5px] text-indigo-300">$1</code>');
    
    return processed;
  };

  const parseTable = (rows: string[]) => {
    const tableData = rows.map(row => {
      return row.split("|").map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    });
    const headers = tableData[0] || [];
    const body = tableData.slice(1);
    return { headers, body };
  };

  return (
    <div className="space-y-4 leading-relaxed text-sm select-text">
      {parts.map((p, idx) => {
        if (p.type === "code") {
          return (
            <div key={idx} className="my-4 overflow-hidden rounded-xl border border-white/5 bg-neutral-950/60 backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 bg-neutral-900/40 px-4 py-2.5 font-mono text-[11px] text-neutral-450">
                <span className="uppercase font-semibold tracking-wider">{p.language}</span>
                <button
                  onClick={() => handleCopy(p.content, idx)}
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-[12px] font-mono text-neutral-200 text-left leading-relaxed select-text bg-black/20">
                <code>{p.content}</code>
              </pre>
            </div>
          );
        }

        // Parse text into block-level elements
        const lines = p.content.split("\n");
        const blocks: any[] = [];
        let currentList: any[] = [];
        let currentTable: string[] = [];

        const flushList = () => {
          if (currentList.length > 0) {
            blocks.push({ type: "list", items: [...currentList] });
            currentList = [];
          }
        };

        const flushTable = () => {
          if (currentTable.length > 0) {
            blocks.push({ type: "table", rows: [...currentTable] });
            currentTable = [];
          }
        };

        lines.forEach((line) => {
          const trimmed = line.trim();

          // Table row detection
          const isTable = line.includes("|");
          if (isTable) {
            flushList();
            const isAlignRow = trimmed.replace(/[\s\-\|:]/g, "") === "";
            if (!isAlignRow) {
              currentTable.push(line);
            }
            return;
          } else {
            flushTable();
          }

          // Divider
          if (trimmed === "---" || trimmed === "___" || trimmed === "***") {
            flushList();
            blocks.push({ type: "divider" });
            return;
          }

          // Headings
          const h1Match = line.match(/^#\s+(.*)/);
          if (h1Match) {
            flushList();
            blocks.push({ type: "h1", text: h1Match[1] });
            return;
          }
          const h2Match = line.match(/^##\s+(.*)/);
          if (h2Match) {
            flushList();
            blocks.push({ type: "h2", text: h2Match[1] });
            return;
          }
          const h3Match = line.match(/^###\s+(.*)/);
          if (h3Match) {
            flushList();
            blocks.push({ type: "h3", text: h3Match[1] });
            return;
          }
          const h4Match = line.match(/^####\s+(.*)/);
          if (h4Match) {
            flushList();
            blocks.push({ type: "h4", text: h4Match[1] });
            return;
          }

          // List Items (Bullet)
          const listMatch = line.match(/^[\*\-\+]\s+(.*)/);
          if (listMatch) {
            currentList.push({ type: "bullet", text: listMatch[1] });
            return;
          }

          // List Items (Numbered)
          const numListMatch = line.match(/^\d+\.\s+(.*)/);
          if (numListMatch) {
            currentList.push({ type: "number", text: numListMatch[1] });
            return;
          }

          // Empty line
          if (trimmed === "") {
            flushList();
            return;
          }

          // Paragraph
          flushList();
          blocks.push({ type: "paragraph", text: line });
        });

        flushList();
        flushTable();

        return (
          <div key={idx} className="space-y-3.5 text-left font-sans select-text">
            {blocks.map((block, bIdx) => {
              switch (block.type) {
                case "h1":
                  return (
                    <h1 key={bIdx} className="text-[17px] font-semibold tracking-tight text-white mt-6 mb-3 border-b border-white/5 pb-1.5">
                      {block.text}
                    </h1>
                  );
                case "h2":
                  return (
                    <h2 key={bIdx} className="text-[14.5px] font-semibold tracking-tight text-white mt-5 mb-2 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
                      {block.text}
                    </h2>
                  );
                case "h3":
                  return (
                    <h3 key={bIdx} className="text-[11px] font-semibold uppercase tracking-wider text-neutral-450 mt-4 mb-1.5">
                      {block.text}
                    </h3>
                  );
                case "h4":
                  return (
                    <h4 key={bIdx} className="text-[13px] font-semibold text-neutral-350 mt-3.5 mb-1">
                      {block.text}
                    </h4>
                  );
                case "divider":
                  return <hr key={bIdx} className="border-t border-white/[0.06] my-4" />;
                case "list":
                  const isNumbered = block.items[0]?.type === "number";
                  const ListTag = isNumbered ? "ol" : "ul";
                  return (
                    <ListTag key={bIdx} className={cn("space-y-1.5 mb-4 pl-5 text-neutral-300 text-[13.5px] leading-relaxed", isNumbered ? "list-decimal" : "list-disc")}>
                      {block.items.map((item: any, iIdx: number) => (
                        <li key={iIdx} dangerouslySetInnerHTML={{ __html: formatInline(item.text) }} />
                      ))}
                    </ListTag>
                  );
                case "table":
                  const parsedTable = parseTable(block.rows);
                  return (
                    <div key={bIdx} className="my-4 overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/[0.02]">
                            {parsedTable.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-3 font-semibold text-neutral-200" dangerouslySetInnerHTML={{ __html: formatInline(h) }} />
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedTable.body.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-3 text-neutral-350" dangerouslySetInnerHTML={{ __html: formatInline(cell) }} />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                case "paragraph":
                default:
                  return (
                    <p key={bIdx} className="text-[13.5px] leading-relaxed text-neutral-300 my-2 select-text" dangerouslySetInnerHTML={{ __html: formatInline(block.text) }} />
                  );
              }
            })}
          </div>
        );
      })}
    </div>
  );
}

export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const lastProjectId = useRef<string | null>(null);
  const loadedProjectId = useRef<string | null>(null);
  const prevMessagesCount = useRef<number>(0);

  const selectedProjectId = searchParams.get("projectId") || "common-chat";
  const isCommonChat = selectedProjectId === "common-chat";

  const [commonChatMessages, setCommonChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("common_chat_messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("common_chat_messages", JSON.stringify(commonChatMessages));
  }, [commonChatMessages]);

  const { data: project } = useProject(selectedProjectId && !isCommonChat ? selectedProjectId : undefined);
  const { data: dbMessages, isLoading: dbMessagesLoading } = useChatMessages(selectedProjectId && !isCommonChat ? selectedProjectId : undefined);

  const messages = isCommonChat ? commonChatMessages : dbMessages;
  const messagesLoading = isCommonChat ? false : dbMessagesLoading;

  const sendMessage = useSendMessage();
  const deleteMessages = useDeleteChatMessages();

  // Handle precise scroll position management
  useEffect(() => {
    // 1. If project changes, reset scroll immediately to top
    if (lastProjectId.current !== selectedProjectId) {
      lastProjectId.current = selectedProjectId;
      loadedProjectId.current = null;
      prevMessagesCount.current = 0;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      return;
    }

    // 2. If messages loaded for the first time for this project
    if (messages && loadedProjectId.current !== selectedProjectId) {
      loadedProjectId.current = selectedProjectId;
      prevMessagesCount.current = messages.length;
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      return;
    }

    // 3. Scroll to bottom ONLY on new message activity (messages count increases)
    if (scrollRef.current && messages && messages.length > prevMessagesCount.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      prevMessagesCount.current = messages.length;
    }

    // 4. Scroll to bottom if isGenerating becomes true (user just sent a message)
    if (scrollRef.current && isGenerating) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, selectedProjectId]);

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
    const steps = isCommonChat
      ? [
          "Processing Request...",
          "Analyzing Concept...",
          "Formulating Response...",
        ]
      : [
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
      if (isCommonChat) {
        const userMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          project_id: "common-chat",
          role: "user",
          content,
          created_at: new Date().toISOString(),
        };

        const newMessages = [...commonChatMessages, userMsg];
        setCommonChatMessages(newMessages);

        const formattedHistory = newMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

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

        const assistantMsg: ChatMessage = {
          id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
          project_id: "common-chat",
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        };

        setCommonChatMessages([...newMessages, assistantMsg]);
        return;
      }

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

  useEffect(() => {
    const initialQuery = location.state?.initialQuery;
    if (initialQuery) {
      // Clear location state so the query is sent only once
      navigate(location.pathname + location.search, { replace: true, state: {} });
      handleSend(initialQuery);
    }
  }, [location.state, location.pathname, location.search, navigate]);

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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#09090B] text-neutral-200">
      {/* ── PANEL 1: LEFT CONVERSATION SIDEBAR ────────────────── */}
      <aside
        style={{
          background: "rgba(10, 10, 12, 0.4)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
        className="hidden lg:flex w-56 xl:w-64 border-r border-white/[0.06] flex-col shrink-0"
      >
        <div className="p-4.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <span className="font-instrument text-[13px] font-semibold uppercase tracking-widest text-neutral-300">Workspace AI</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/projects?new=1")}
            className="h-7 w-7 p-0 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white"
            title="Create New Project Thread"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-white/[0.04] shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threads..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-white/5 bg-white/[0.02] text-white placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.04] transition-all"
            />
          </div>
        </div>

        {/* Sidebar Project Threads List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 sidebar-scroll">
          <div className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-neutral-500 uppercase tracking-widest">
            <Pin className="h-3 w-3 text-neutral-600" /> Pinned Threads
          </div>

          {/* Common Chat / AI Assistant permanent option */}
          {(!searchQuery || "ai assistant".includes(searchQuery.toLowerCase()) || "common chat".includes(searchQuery.toLowerCase())) && (
            <motion.button
              onClick={() => selectProject("common-chat")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-all relative group overflow-hidden border",
                isCommonChat
                  ? "bg-indigo-500/10 border-indigo-500/30 text-white shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                  : "bg-white/[0.01] border-white/5 text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]"
              )}
            >
              {isCommonChat && (
                <motion.div
                  layoutId="activeThreadIndicator"
                  className="absolute left-0 top-3 bottom-3 w-[2.5px] bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500 rounded-r-md"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse-slow shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold block truncate">AI Assistant</span>
                <span className="text-[10px] text-neutral-500 block truncate font-medium">General AI Assistant</span>
              </div>
            </motion.button>
          )}

          {filteredProjects.map((p) => {
            const isSelected = selectedProjectId === p.id;
            return (
              <motion.button
                key={p.id}
                onClick={() => selectProject(p.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-all relative group overflow-hidden border",
                  isSelected
                    ? "bg-white/[0.04] border-white/10 text-white shadow-sm"
                    : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.01]"
                )}
              >
                {/* Active Indicator Bar */}
                {isSelected && (
                  <motion.div
                    layoutId="activeThreadIndicator"
                    className="absolute left-0 top-3 bottom-3 w-[2.5px] bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500 rounded-r-md"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <MessageSquare className="h-3.5 w-3.5 text-indigo-400/80 group-hover:text-indigo-400 transition-colors shrink-0" />
                <span className="truncate flex-1 font-medium">{p.name}</span>
                <Bookmark className="h-3 w-3 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </motion.button>
            );
          })}
          {filteredProjects.length === 0 && (!searchQuery || !("ai assistant".includes(searchQuery.toLowerCase()) || "common chat".includes(searchQuery.toLowerCase()))) && (
            <p className="text-[11px] text-neutral-500 px-3 py-2 italic text-left">No threads found.</p>
          )}
        </div>
      </aside>

      {/* ── PANEL 2: CENTER CHAT CONTAINER ───────────────────── */}
      <section className="flex-1 flex flex-col min-w-0 bg-[#09090B] relative overflow-hidden">
        {/* Premium Engineering Grid Background */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Base Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          {/* Macro grid lines */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.6) 1px, transparent 1px)`,
              backgroundSize: "120px 120px",
            }}
          />
          {/* Radial glow background plate */}
          <div 
            className="absolute inset-0"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.04) 0%, rgba(0, 0, 0, 0) 70%)",
            }}
          />
          {/* Subtle top sheen */}
          <div 
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.25) 50%, transparent 100%)",
            }}
          />
        </div>

        {/* Top Context Switching bar */}
        <div
          style={{
            background: "rgba(10, 10, 12, 0.4)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
          className="h-14 border-b border-white/[0.06] px-3 sm:px-5 flex items-center justify-between shrink-0 z-10 overflow-hidden"
        >
          {isCommonChat ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-instrument text-[11px] uppercase font-bold tracking-widest text-indigo-400 shrink-0">General AI Assistant</span>
              <span className="text-neutral-600 hidden sm:inline">|</span>
              <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline truncate">Ask general coding, DSA, or system design questions</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full sidebar-scroll pt-1">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-widest mr-2 shrink-0">Focus:</span>
              {CONTEXT_SWITCHES.map((sw) => {
                const isSelected = selectedContext === sw.id;
                return (
                  <motion.button
                    key={sw.id}
                    onClick={() => setSelectedContext(sw.id as ContextType)}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all shrink-0 relative",
                      isSelected
                        ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                        : "border-white/5 bg-white/[0.02] text-neutral-400 hover:border-white/10 hover:text-neutral-200"
                    )}
                  >
                    <sw.icon className={cn("h-3.5 w-3.5", sw.color)} />
                    <span>{sw.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversation Stream thread panel */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 sidebar-scroll z-10">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center text-center"
              >
                {/* AI Hero Orb */}
                <div className="relative mb-4 mt-2 flex justify-center">
                  <div className="absolute inset-0 -m-12 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-60 animate-pulse-slow" />
                  <AIOrb variant="fluid-dots" size={160} className="relative z-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-heading text-3xl font-semibold tracking-tight text-white">
                    {isCommonChat ? "General AI Assistant" : "Project Assistant Workspace"}
                  </h2>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                    {isCommonChat
                      ? "Ask any programming questions, DSA concepts, system design trade-offs, or career guidance. Not associated with any project context."
                      : "Consult your AI agent on architecture blueprints, database layouts, or API designs. Reference sections using @Architecture or @Database."}
                  </p>
                </div>
              </motion.div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl pt-2">
                {(isCommonChat ? GENERAL_SUGGESTIONS : SUGGESTIONS).map((s, idx) => {
                  const icons = [Sliders, Boxes, ShieldCheck, Terminal];
                  const Icon = icons[idx % icons.length];
                  const colors = [
                    "from-indigo-500/5 to-indigo-600/2 hover:border-indigo-500/20 text-indigo-400 hover:shadow-[0_4px_20px_rgba(99,102,241,0.15)]",
                    "from-purple-500/5 to-purple-600/2 hover:border-purple-500/20 text-purple-400 hover:shadow-[0_4px_20px_rgba(168,85,247,0.15)]",
                    "from-emerald-500/5 to-emerald-600/2 hover:border-emerald-500/20 text-emerald-400 hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]",
                    "from-cyan-500/5 to-cyan-600/2 hover:border-cyan-500/20 text-cyan-400 hover:shadow-[0_4px_20px_rgba(6,182,212,0.15)]"
                  ];
                  return (
                    <motion.button
                      key={s}
                      onClick={() => handleSend(s)}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * idx, duration: 0.5, ease: "easeOut" }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "rounded-2xl border border-white/5 bg-gradient-to-br p-4.5 text-left transition-all duration-300 relative group overflow-hidden flex flex-col justify-between h-32 backdrop-blur-sm",
                        colors[idx % colors.length]
                      )}
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-neutral-400 shrink-0" />
                      </div>
                      <span className="text-[13px] font-medium text-neutral-300 group-hover:text-white leading-snug">
                        {s}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((msg, i) => {
                const isSystem = msg.role === "system";
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-[11px] font-medium text-neutral-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{msg.content}</span>
                      </div>
                    </div>
                  );
                }

                const isAssistant = msg.role === "assistant";
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "flex gap-3 text-sm max-w-3xl",
                      isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 text-white font-bold select-none text-[10px]",
                      isAssistant
                        ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                        : "bg-neutral-800 border-white/5"
                    )}>
                      {isAssistant ? "AI" : <User className="h-4.5 w-4.5 text-neutral-400" />}
                    </div>

                    <div className="space-y-1.5 max-w-[calc(100%-44px)]">
                      <div className="flex items-center gap-2 px-1">
                        <span className="font-semibold text-neutral-200 text-xs">
                          {isAssistant ? (isCommonChat ? "AI Assistant" : "Workspace AI") : "Lead Architect"}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {formatRelative(msg.created_at)}
                        </span>
                      </div>
                      <div className={cn(
                        "rounded-2xl border p-4.5 shadow-xl select-text leading-relaxed font-sans text-sm",
                        isAssistant
                          ? "border-white/5 bg-white/[0.02] text-neutral-200"
                          : "border-indigo-500/20 bg-indigo-500/5 text-white"
                      )}>
                        {isAssistant ? <RichChatMessage text={msg.content} /> : <p className="text-left font-sans text-sm leading-relaxed">{msg.content}</p>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Thinking / Loader state */}
          {isGenerating && (
            <div className="flex gap-3 mr-auto max-w-3xl max-w-4xl mx-auto">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-cyan-500 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
              </div>
              <div className="space-y-1.5">
                <span className="font-semibold text-neutral-200 text-xs block text-left px-1">
                  {isCommonChat ? "AI Assistant is thinking" : "Workspace AI is thinking"}
                </span>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-2.5">
                  <span className="text-xs text-neutral-400 font-mono animate-pulse flex items-center gap-1.5">
                    {thinkingStep || "Processing..."}
                    <span className="flex gap-1 items-center ml-1">
                      <span className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1 w-1 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger-500/20 bg-danger-500/5 px-4 py-3 text-xs text-danger-300 max-w-4xl mx-auto">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div
          style={{
            background: "rgba(10, 10, 12, 0.4)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
          className="p-4.5 border-t border-white/[0.06] shrink-0 space-y-3.5 z-10"
        >
          {/* Quick Actions (Floating Pills) */}
          {!isCommonChat && (
            <div className="flex flex-wrap gap-2 overflow-x-auto max-w-full sidebar-scroll pb-1">
              {QUICK_ACTIONS.map((chip, idx) => {
                const icons = [Boxes, Database, ShieldCheck, Code2, Rocket];
                const Icon = icons[idx % icons.length];
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleSend(chip.cmd)}
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.03] text-[11px] font-medium text-neutral-400 hover:border-white/10 hover:text-neutral-200 transition-all shrink-0 hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                  >
                    <Icon className="h-3.5 w-3.5 text-indigo-400/80" />
                    <span>{chip.text}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Textarea prompt area */}
          <div className="relative border border-white/10 bg-[#121319]/80 backdrop-blur-md rounded-2xl p-2.5 shadow-2xl focus-within:border-indigo-500/40 focus-within:shadow-[0_0_24px_rgba(99,102,241,0.1)] transition-all duration-300 max-w-4xl mx-auto w-full">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isCommonChat ? "Ask AI Assistant... Try asking general coding questions" : "Ask Workspace AI... Try @Architecture or @Database"}
              rows={1}
              className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none pt-2 pb-14 px-3 leading-relaxed font-sans"
            />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
              {/* Decorative attachments/shortcuts */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Attach file (visual only)"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {!isCommonChat ? (
                  <span className="text-[10px] text-neutral-500 font-medium font-sans">
                    Use <strong className="text-neutral-400">@</strong> to switch scope
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-500 font-medium font-sans">
                    General purpose AI chat
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Delete / Clear button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isCommonChat) {
                      setCommonChatMessages([]);
                    } else {
                      deleteMessages.mutate(selectedProjectId!);
                    }
                  }}
                  disabled={!messages || messages.length === 0 || (!isCommonChat && deleteMessages.isPending)}
                  className="h-8 w-8 p-0 text-neutral-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Clear Conversation Logs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {/* Send button with shortcut hint */}
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isGenerating}
                  className="h-8 px-3.5 text-xs font-semibold flex items-center gap-1.5 rounded-lg shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
                >
                  <span>Send</span>
                  <CornerDownLeft className="h-3 w-3 opacity-60" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PANEL 3: RIGHT PROJECT LIVE CONTEXT PANEL ───────── */}
      <aside
        style={{
          background: "rgba(10, 10, 12, 0.4)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        }}
        className="hidden xl:flex xl:w-64 2xl:w-72 border-l border-white/[0.06] p-4 xl:p-4.5 space-y-5 shrink-0 flex-col overflow-y-auto sidebar-scroll text-left"
      >
        {project ? (
          <>
            {/* Project name & info card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2 hover:border-white/10 transition-all duration-300">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-widest block">Current Project</span>
              <h4 className="font-heading text-sm font-semibold text-white tracking-tight">{project.name}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">{project.description}</p>
            </div>

            {/* AI Engineering Score */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2 hover:border-white/10 transition-all duration-300">
              <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-neutral-500 tracking-widest">
                <span>Engineering Score</span>
                <span className="text-emerald-400 font-mono text-xs font-bold">{overallScore}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700",
                    overallScore >= 80 ? "bg-emerald-500" : overallScore >= 60 ? "bg-amber-500" : "bg-danger-500"
                  )}
                />
              </div>
              <span className="text-[10px] text-neutral-500 block leading-normal">Score calculated dynamically from specifications.</span>
            </div>

            {/* Generated Status Tree */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3.5 hover:border-white/10 transition-all duration-300">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-widest block">Generated Artifacts</span>
              <div className="space-y-2 text-xs">
                {[
                  { label: "System Architecture", has: !!project.architecture },
                  { label: "PostgreSQL Database Schema", has: !!project.database_schema },
                  { label: "API OpenAPI Specification", has: !!project.api_spec },
                  { label: "Security & OWASP Audit", has: !!project.security_report },
                  { label: "Documentation Suite", has: !!project.documentation },
                  { label: "Deployment CI/CD Targets", has: !!project.deployment_plan },
                ].map((art) => (
                  <div key={art.label} className="flex items-center justify-between text-xs text-neutral-300">
                    <span className="text-neutral-400 font-medium">{art.label}</span>
                    {art.has ? (
                      <Badge variant="success" className="text-[9px] px-1.5 py-0.5 font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">Generated</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 text-neutral-500 border border-white/5 rounded-md">Pending</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Referenced Files list */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-all duration-300">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-widest block">Referenced Files in Chat</span>
              <div className="space-y-2">
                {[
                  { name: "App.tsx", path: "src/App.tsx", icon: Boxes },
                  { name: "schema.sql", path: "supabase/migrations/schema.sql", icon: Database },
                  { name: "apiClient.ts", path: "src/api/apiClient.ts", icon: Code2 },
                ].map((file) => (
                  <div key={file.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-3 py-2 text-xs text-neutral-300 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <file.icon className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-semibold block truncate text-xs leading-tight text-neutral-200">{file.name}</span>
                        <span className="text-[9px] text-neutral-500 block truncate mt-0.5">{file.path}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-neutral-500 italic py-6 text-center">Select a project thread to load context.</p>
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
