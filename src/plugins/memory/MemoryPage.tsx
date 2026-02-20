"use client";
import { useState } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import { Brain, Search, Loader2, FileText, MessageSquare } from "lucide-react";

export function MemoryPage() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearched(true);
    setAnswer("");
    setError("");
    try {
      // Memory search isn't a direct gateway RPC — use chat to ask the agent
      await rpcClient.request("chat.send", {
        sessionKey: "memory-search",
        message: `Search your memory files for: "${query.trim()}". Return the most relevant snippets with file paths and line numbers. Be concise.`,
        deliver: false,
      });
      // Poll for response
      const maxWait = 30000;
      const start = Date.now();
      while (Date.now() - start < maxWait) {
        await new Promise((r) => setTimeout(r, 2000));
        const history: any = await rpcClient.request("chat.history", {
          sessionKey: "memory-search",
          limit: 5,
        });
        const messages = history?.messages || [];
        const last = messages[messages.length - 1];
        if (last?.role === "assistant") {
          const text =
            typeof last.content === "string"
              ? last.content
              : Array.isArray(last.content)
                ? last.content
                    .filter((b: any) => b.type === "text")
                    .map((b: any) => b.text)
                    .join("\n")
                : JSON.stringify(last.content);
          setAnswer(text);
          break;
        }
      }
      if (!answer && Date.now() - start >= maxWait) {
        setError("Search timed out. Try again or use the Chat page.");
      }
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold">Memory</h1>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search agent memory..."
            className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#222] rounded-xl text-white placeholder-[#555] focus:outline-none focus:border-emerald-500/50 text-sm"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-sm font-medium"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Info */}
      {!searched && (
        <div className="card p-8 text-center text-[#888]">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Search your agent&apos;s memory files</p>
          <p className="text-xs mt-2 text-[#555]">
            Uses the agent to search MEMORY.md and memory/*.md files
          </p>
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="card p-8 text-center text-[#888]">
          <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-emerald-500" />
          <p>Searching memory...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 border-red-500/20 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Answer */}
      {answer && !searching && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-400">Agent Response</span>
          </div>
          <div className="text-sm text-[#ccc] whitespace-pre-wrap leading-relaxed">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
}
