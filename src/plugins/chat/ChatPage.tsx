"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import { Send, Loader2, MessagesSquare } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamBuffer]);

  // Listen for streaming push notifications
  useEffect(() => {
    const unsub = rpcClient.on("agent.stream", (data: any) => {
      if (data?.chunk) {
        setStreamBuffer((prev) => prev + data.chunk);
      }
      if (data?.done) {
        setStreamBuffer((prev) => {
          if (prev) {
            setMessages((msgs) => [
              ...msgs,
              { role: "assistant", content: prev, timestamp: new Date() },
            ]);
          }
          return "";
        });
        setSending(false);
      }
    });
    return unsub;
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setStreamBuffer("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, timestamp: new Date() },
    ]);
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
  }, [input, sending]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && !streamBuffer && (
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
              className={`max-w-[75%] px-4 py-3 rounded-xl text-sm ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-[#111] border border-[#222] rounded-bl-sm font-mono text-[13px] whitespace-pre-wrap"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming buffer */}
        {streamBuffer && (
          <div className="flex justify-start">
            <div className="max-w-[75%] px-4 py-3 rounded-xl rounded-bl-sm bg-[#111] border border-[#222] font-mono text-[13px] whitespace-pre-wrap">
              {streamBuffer}
              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Loading indicator (non-streaming) */}
        {sending && !streamBuffer && (
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
