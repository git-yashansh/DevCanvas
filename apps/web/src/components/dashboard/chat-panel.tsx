import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles, User, Trash2, AlertCircle } from "lucide-react";
import { Button, Input } from "@ui/index";
import { useChatMessages, useSendMessage, useDeleteChatMessages, chatKeys } from "@/lib/queries/chat";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn, formatRelative } from "@utils/index";

const SUGGESTIONS = [
  "Design a multi-tenant SaaS architecture with billing",
  "Generate a Postgres schema for a project management app",
  "What are the OWASP Top 10 vulnerabilities I should check?",
  "Estimate cloud costs for a real-time collaboration platform",
];

export function ChatPanel({ projectId }: { projectId: string }) {
  const { data: messages, isLoading } = useChatMessages(projectId);
  const sendMessage = useSendMessage();
  const deleteMessages = useDeleteChatMessages();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  async function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isGenerating) return;

    setError(null);
    setInput("");
    setIsGenerating(true);

    try {
      await sendMessage.mutateAsync({ projectId, content });

      const history = messages ?? [];
      const allMessages = [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
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
          body: JSON.stringify({ messages: allMessages }),
        },
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (!data.reply) throw new Error("No reply from AI.");

      await supabase.from("chat_messages").insert({
        project_id: projectId,
        role: "assistant",
        content: data.reply,
      });

      await queryClient.invalidateQueries({ queryKey: chatKeys.messages(projectId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI response.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[calc(100vh-280px)] min-h-[400px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-400" />
          <h3 className="font-heading text-sm font-semibold text-neutral-100">
            AI Assistant
          </h3>
        </div>
        {messages && messages.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMessages.mutate(projectId)}
            disabled={deleteMessages.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </Button>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-4"
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10">
              <Sparkles className="h-6 w-6 text-primary-400" />
            </div>
            <h4 className="mt-4 font-heading text-sm font-semibold text-neutral-100">
              Start a conversation
            </h4>
            <p className="mt-1 max-w-xs text-xs text-neutral-400">
              Ask about architecture, databases, APIs, security, or system design.
            </p>
            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-left text-xs text-neutral-300 transition-colors hover:border-border-hover hover:text-neutral-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role !== "user" ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
                  <Sparkles className="h-4 w-4 text-primary-400" />
                </span>
              ) : null}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary-500/15 text-neutral-100"
                    : "border border-border bg-surface-2 text-neutral-200",
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <p className="mt-1.5 text-xs text-neutral-600">
                  {formatRelative(msg.created_at)}
                </p>
              </div>
              {msg.role === "user" ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                  <User className="h-4 w-4 text-neutral-400" />
                </span>
              ) : null}
            </motion.div>
          ))
        )}

        {isGenerating ? (
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
              <Sparkles className="h-4 w-4 text-primary-400" />
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary-400" />
              <span className="text-sm text-neutral-400">Generating…</span>
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-xs text-danger-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about architecture, schemas, APIs…"
          disabled={isGenerating}
        />
        <Button
          variant="gradient"
          size="icon"
          onClick={() => handleSend()}
          disabled={!input.trim() || isGenerating}
          aria-label="Send message"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
