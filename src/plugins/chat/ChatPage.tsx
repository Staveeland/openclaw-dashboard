"use client";
import { useState, useRef, useEffect } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import { MessagesSquare, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");

    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res: any = await rpcClient.request("agent.send", {
        message: text,
      });
      const reply =
        res?.result?.payloads?.[0]?.text ||
        res?.text ||
        res?.message ||
        (typeof res === "string" ? res : JSON.stringify(res));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, timestamp: new Date() },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err?.message || "Failed to get response"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <MessagesSquare className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[#888]">
              <MessagesSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Send a message to start chatting with your agent</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-xl text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-[#111] border border-[#222] text-white rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-[#111] border border-[#222] px-4 py-3 rounded-xl rounded-bl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#888]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#222] pt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
  );
}
