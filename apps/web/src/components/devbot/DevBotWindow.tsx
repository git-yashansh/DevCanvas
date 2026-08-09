import React, { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useDevBot } from "./DevBotContext";
import {
  Send,
  X,
  Minus,
  Sparkles,
  RefreshCw,
  Trash2,
  Bot,
  User,
  MessageSquare,
} from "lucide-react";
import botLogo from "../../styles/botlogo.png";
import "./devbot.css";

const QUICK_SUGGESTIONS = [
  "How do I generate a database?",
  "How do I generate an API spec?",
  "How do I design an architecture?",
  "Where do I raise a support ticket?",
];

export function DevBotWindow() {
  const {
    chatOpen,
    minimized,
    messages,
    isSending,
    error,
    closeChat,
    minimizeChat,
    openChat,
    sendMessage,
    clearHistory,
    startTour,
  } = useDevBot();

  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  if (!chatOpen) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string) => {
    const buttonRegex = /\[Open\s+([^|\]]+)\|([^\]]+)\]/g;
    let cleanText = content.replace(buttonRegex, "");
    
    const buttons: { label: string; path: string }[] = [];
    let match;
    const matchRegex = /\[Open\s+([^|\]]+)\|([^\]]+)\]/g;
    while ((match = matchRegex.exec(content)) !== null) {
      buttons.push({ label: match[1].trim(), path: match[2].trim() });
    }

    return (
      <div className="space-y-2.5">
        <div className="text-[13px] text-white/95 leading-relaxed font-sans whitespace-pre-wrap break-words">
          {cleanText.trim()}
        </div>
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => {
                  navigate(btn.path);
                  // Minimize on navigate so they can see the target page
                  minimizeChat();
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-500/20 border border-indigo-500/40 px-3.5 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/40 hover:text-white transition-all cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Minimized state renders as a simple bar at bottom right
  if (minimized) {
    return (
      <div
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 flex w-72 items-center justify-between rounded-xl border border-white/10 bg-[#0A0A0E] px-4 py-3 shadow-2xl shadow-black/80 cursor-pointer select-none hover:border-indigo-500/40"
      >
        <div className="flex items-center gap-2.5">
          <img src={botLogo} alt="DevBot" className="h-6 w-6 object-contain" />
          <span className="text-xs font-heading font-semibold text-white">DevBot Guide (Online)</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeChat();
          }}
          className="text-white/40 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="
        fixed bottom-6 right-6 z-50 
        flex flex-col 
        w-[calc(100vw-2rem)] sm:w-[380px]
        h-[520px] max-h-[85vh]
        rounded-2xl border border-white/10 
        bg-[#09090C]/95 backdrop-blur-md 
        shadow-2xl shadow-black/90 
        overflow-hidden
      "
    >
      {/* ── 1. Header ── */}
      <div className="flex items-center justify-between border-b border-white/8 bg-[#0C0C10] px-4 py-3 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-purple-500/20 p-0.5 bg-black/45">
            <img src={botLogo} alt="DevBot" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-heading font-bold text-white tracking-wide">DevBot</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-400 font-medium font-sans">Online</span>
            </div>
            <p className="text-[10px] text-white/40 leading-none">Your AI Guide for DevCanvas</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              clearHistory();
            }}
            title="Clear Chat History"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={startTour}
            title="Restart Tour"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={minimizeChat}
            title="Minimize"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={closeChat}
            title="Close"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Messages & Suggestions ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* Empty history welcome */}
        {messages.length === 0 && (
          <div className="space-y-4 text-center py-6 px-2 select-none">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-heading font-bold text-white uppercase tracking-wider">How can I help you today?</h4>
              <p className="text-[11px] text-white/35 mt-1 leading-normal max-w-xs mx-auto">
                Ask me details about system design, DB entities, API schemas, or how to navigate around the app.
              </p>
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`
                flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs
                ${
                  msg.role === "user"
                    ? "bg-neutral-800 border-neutral-700 text-neutral-300"
                    : "bg-indigo-650/15 border-indigo-500/20 text-indigo-400"
                }
              `}
            >
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
            </div>

            {/* Bubble */}
            <div
              className={`
                max-w-[78%] rounded-2xl px-3.5 py-2.5 border
                ${
                  msg.role === "user"
                    ? "bg-[#18181B] border-white/5 rounded-tr-none text-right"
                    : "bg-[#0C0C10] border-white/8 rounded-tl-none text-left"
                }
              `}
            >
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-indigo-650/15 border-indigo-500/20 text-indigo-400">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl border border-white/8 bg-[#0C0C10] px-3.5 py-3 rounded-tl-none">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
            </div>
          </div>
        )}

        {/* Errors display */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-xs text-rose-400 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ── Suggestions Chips ── */}
      {messages.length === 0 && (
        <div className="px-4 py-2 border-t border-white/5 select-none bg-black/10">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((text) => (
              <button
                key={text}
                onClick={() => sendMessage(text)}
                className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-1 text-[10px] text-white/50 hover:border-white/10 hover:bg-white/[0.05] hover:text-white transition-all cursor-pointer"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Footer Input bar ── */}
      <div className="border-t border-white/8 bg-[#09090C] p-3 flex items-end gap-2.5">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask DevBot anything..."
          className="flex-1 max-h-24 min-h-[38px] rounded-xl border border-white/[0.06] bg-[#050508] px-3 py-2 text-xs text-white placeholder:text-white/35 outline-none resize-none focus:border-indigo-500/40 font-sans"
          style={{ lineHeight: "1.4" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all cursor-pointer outline-none"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
