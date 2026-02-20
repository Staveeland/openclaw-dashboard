"use client";
import { useState } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import { Brain, Search, Loader2, FileText } from "lucide-react";

interface MemoryResult {
  path: string;
  score: number;
  snippet: string;
  startLine?: number;
  endLine?: number;
}

export function MemoryPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemoryResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearched(true);
    try {
      const res: any = await rpcClient.request("memory.search", {
        query: query.trim(),
      });
      setResults(res?.results || res || []);
    } catch {
      setResults([]);
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
            placeholder="Search memory files..."
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

      {/* Results */}
      {!searched ? (
        <div className="card p-8 text-center text-[#888]">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Search your agent&apos;s memory</p>
        </div>
      ) : results.length === 0 ? (
        <div className="card p-8 text-center text-[#888]">
          <p>No results found for &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div
              key={i}
              className="card p-4 hover:border-[#333] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="font-mono text-sm text-emerald-400">
                  {r.path}
                </span>
                {r.startLine && (
                  <span className="text-xs text-[#888]">
                    L{r.startLine}
                    {r.endLine ? `-${r.endLine}` : ""}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round(r.score * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#888]">
                    {Math.round(r.score * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#ccc] whitespace-pre-wrap line-clamp-3">
                {r.snippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
