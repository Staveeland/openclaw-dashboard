"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import {
  Send,
  Loader2,
  MessagesSquare,
  Plus,
  MessageCircle,
  ChevronLeft,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface ChatSession {
  key: string;
  label?: string;
  lastMessage?: string;
  updatedAt?: number;
}

function extractText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("\n");
  return JSON.stringify(content);
}

function generateSessionKey(): string {
  const id = crypto.randomUUID().slice(0, 8);
  return `dashboard-${id}`;
}

export function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string>(() => generateSessionKey());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(activeSession);

  // Keep ref in sync
  activeRef.current = activeSession;

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load sessions list on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Load chat history when switching sessions
  useEffect(() => {
    loadHistory(activeSession);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [activeSession]);

  // Listen for streaming chat events
  useEffect(() => {
    const unsub = rpcClient.on("chat", (data: any) => {
      if (!data || data.sessionKey !== activeRef.current) return;
      if (data.state === "final") {
        // Refresh history to get the complete message
        loadHistory(activeRef.current);
        setSending(false);
      }
    });
    return unsub;
  }, []);

  async function loadSessions() {
    try {
      const res: any = await rpcClient.request("sessions.list", {
        limit: 100,
      });
      const allSessions = res?.sessions || [];
      // Filter to dashboard sessions + any with recent activity
      const chatSessions: ChatSession[] = allSessions
        .filter((s: any) => s.key?.startsWith("dashboard-"))
        .map((s: any) => ({
          key: s.key,
          label: s.label || s.key,
          updatedAt: s.lastActivityAt || s.createdAt,
        }))
        .sort((a: ChatSession, b: ChatSession) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSessions(chatSessions);
    } catch {}
  }

  async function loadHistory(sessionKey: string) {
    setLoadingHistory(true);
    try {
      const res: any = await rpcClient.request("chat.history", {
        sessionKey,
        limit: 200,
      });
      const msgs = (res?.messages || []).map((m: any) => ({
        role: m.role,
        content: extractText(m.content),
        timestamp: m.timestamp,
      }));
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleNewChat() {
    const newKey = generateSessionKey();
    setActiveSession(newKey);
    setMessages([]);
    setInput("");
    setSending(false);
    if (pollRef.current) clearTimeout(pollRef.current);
    inputRef.current?.focus();
  }

  function handleSelectSession(key: string) {
    if (key === activeSession) return;
    setActiveSession(key);
    setSending(false);
    if (pollRef.current) clearTimeout(pollRef.current);
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: Date.now() },
    ]);

    try {
      const idempotencyKey = crypto.randomUUID();
      await rpcClient.request("chat.send", {
        sessionKey: activeSession,
        message: text,
        deliver: false,
        idempotencyKey,
      });

      // Poll for response (fallback if events don't arrive)
      const poll = async (attempt: number) => {
        if (attempt > 30) {
          setSending(false);
          return;
        }
        pollRef.current = setTimeout(async () => {
          try {
            const history: any = await rpcClient.request("chat.history", {
              sessionKey: activeRef.current,
              limit: 200,
            });
            const msgs = (history?.messages || []).map((m: any) => ({
              role: m.role,
              content: extractText(m.content),
              timestamp: m.timestamp,
            }));
            const last = msgs[msgs.length - 1];
            if (last?.role === "assistant") {
              setMessages(msgs);
              setSending(false);
              loadSessions(); // refresh sidebar
              return;
            }
          } catch {}
          poll(attempt + 1);
        }, 2000);
      };
      poll(0);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err?.message || "Failed"}`,
          timestamp: Date.now(),
        },
      ]);
      setSending(false);
    }
  }, [input, sending, activeSession]);

  // Get preview text for sidebar
  function getPreview(session: ChatSession): string {
    return session.label && !session.label.startsWith("dashboard-")
      ? session.label
      : session.key.replace("dashboard-", "Chat ");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 -mx-6 lg:-mx-8 -my-0">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-200 overflow-hidden border-r border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0 flex flex-col`}
      >
        <div className="p-3 border-b border-[#1a1a1a]">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <p className="text-[#555] text-xs text-center py-4">No chats yet</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.key}
                onClick={() => handleSelectSession(s.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate flex items-center gap-2 ${
                  s.key === activeSession
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{getPreview(s)}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-[#111] text-[#888] hover:text-white transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <MessagesSquare className="w-4 h-4" />
            )}
          </button>
          <span className="text-sm text-[#888] font-mono truncate">
            {activeSession}
          </span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-[#555]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-[#888]">
                <MessagesSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Send a message to start chatting</p>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-[#111] border border-[#222] rounded-bl-sm whitespace-pre-wrap"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-[#111] border border-[#222] px-4 py-3 rounded-xl rounded-bl-sm">
                <Loader2 className="w-4 h-4 animate-spin text-[#888]" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#1a1a1a] px-4 py-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-emerald-500/50 text-sm"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
