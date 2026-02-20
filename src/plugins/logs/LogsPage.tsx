"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import { Pause, Play, Trash2 } from "lucide-react";

// Dynamic import to avoid SSR issues with xterm
const TerminalComponent = dynamic(
  () => import("@/components/Terminal").then((m) => ({ default: m.Terminal })),
  { ssr: false }
);

export function LogsPage() {
  const [paused, setPaused] = useState(false);
  const [content, setContent] = useState("");
  const bufferRef = useRef("");

  useEffect(() => {
    const unsub = rpcClient.on("logs.line", (data: any) => {
      if (paused) return;
      const line = typeof data === "string" ? data : data?.line || data?.text || JSON.stringify(data);
      bufferRef.current += line + "\r\n";
      setContent(bufferRef.current);
    });

    // Request log tail
    rpcClient.request("logs.tail", { follow: true }).catch(() => {});

    return unsub;
  }, [paused]);

  function handleClear() {
    bufferRef.current = "";
    setContent("");
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setPaused(!paused)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            paused
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-[#111] text-[#888] border border-[#222] hover:text-white"
          }`}
        >
          {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#111] text-[#888] border border-[#222] hover:text-white transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Terminal */}
      <div className="flex-1 card overflow-hidden">
        <TerminalComponent content={content} className="h-full" />
      </div>
    </div>
  );
}
