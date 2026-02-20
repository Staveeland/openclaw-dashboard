"use client";
import { useEffect, useState, useRef } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import {
  Bot,
  Clock,
  Zap,
  GitBranch,
  Activity,
  Loader2,
  RefreshCw,
  MessageSquare,
  Hash,
} from "lucide-react";

interface SessionInfo {
  key: string;
  kind?: string;
  label?: string;
  displayName?: string;
  updatedAt?: number;
  model?: string;
  modelProvider?: string;
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  contextTokens?: number;
  spawned?: {
    parentKey?: string;
    task?: string;
    status?: string;
  };
  channel?: string;
}

type FilterType = "all" | "cron" | "spawned" | "dashboard" | "main";

function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function formatTokens(n?: number): string {
  if (!n) return "0";
  if (n > 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n > 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function getSessionType(s: SessionInfo): { label: string; color: string; icon: typeof Bot } {
  if (s.spawned) return { label: "Sub-Agent", color: "text-purple-400", icon: GitBranch };
  if (s.key?.includes("cron")) return { label: "Cron", color: "text-blue-400", icon: Clock };
  if (s.key?.includes("dashboard")) return { label: "Dashboard", color: "text-emerald-400", icon: MessageSquare };
  if (s.key?.includes("main")) return { label: "Main", color: "text-amber-400", icon: Zap };
  return { label: "Session", color: "text-[#888]", icon: Hash };
}

function isActive(s: SessionInfo): boolean {
  if (!s.updatedAt) return false;
  return Date.now() - s.updatedAt < 300000; // active within 5 min
}

export function AgentsPage() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<any[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchSessions() {
    try {
      const res: any = await rpcClient.request("sessions.list", {
        limit: 100,
        activeMinutes: 10080, // last 7 days
      });
      setSessions(res?.sessions || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    fetchSessions();
    // Live polling every 5 seconds
    intervalRef.current = setInterval(fetchSessions, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Listen for live events
  useEffect(() => {
    const unsubs = [
      rpcClient.on("chat", () => fetchSessions()),
      rpcClient.on("cron", () => fetchSessions()),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  async function loadHistory(key: string) {
    if (expanded === key) {
      setExpanded(null);
      return;
    }
    setExpanded(key);
    try {
      const res: any = await rpcClient.request("chat.history", {
        sessionKey: key,
        limit: 20,
      });
      setExpandedHistory(res?.messages || []);
    } catch {
      setExpandedHistory([]);
    }
  }

  const filtered = sessions.filter((s) => {
    if (filter === "cron") return s.key?.includes("cron");
    if (filter === "spawned") return !!s.spawned;
    if (filter === "dashboard") return s.key?.includes("dashboard");
    if (filter === "main") return s.key?.includes("main") && !s.key?.includes("cron");
    return true;
  });

  const sorted = [...filtered].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const counts = {
    all: sessions.length,
    cron: sessions.filter((s) => s.key?.includes("cron")).length,
    spawned: sessions.filter((s) => s.spawned).length,
    dashboard: sessions.filter((s) => s.key?.includes("dashboard")).length,
    main: sessions.filter((s) => s.key?.includes("main") && !s.key?.includes("cron")).length,
  };

  const activeCount = sessions.filter(isActive).length;

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "main", label: "Main", count: counts.main },
    { key: "cron", label: "Cron", count: counts.cron },
    { key: "spawned", label: "Sub-Agents", count: counts.spawned },
    { key: "dashboard", label: "Dashboard", count: counts.dashboard },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold">Agents & Sessions</h1>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-400">{activeCount} active</span>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); fetchSessions(); }}
          className="p-2 rounded-lg hover:bg-[#111] text-[#888] hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === f.key
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-[#111] text-[#888] border border-[#222] hover:text-white hover:border-[#333]"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-60">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {loading && sessions.length === 0 ? (
        <div className="card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#555]" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card p-8 text-center text-[#888]">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No sessions found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((s) => {
            const type = getSessionType(s);
            const active = isActive(s);
            const Icon = type.icon;
            const isExpanded = expanded === s.key;

            return (
              <div key={s.key}>
                <button
                  onClick={() => loadHistory(s.key)}
                  className={`card w-full text-left p-4 hover:border-[#333] transition-colors ${
                    isExpanded ? "border-emerald-500/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        {active && (
                          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {s.label || s.displayName || s.key}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${type.color} bg-white/5`}>
                            {type.label}
                          </span>
                        </div>
                        {s.spawned?.task && (
                          <p className="text-xs text-[#666] mt-0.5 truncate max-w-md">
                            {s.spawned.task}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#555]">
                          <span className="font-mono">{s.key.length > 40 ? "…" + s.key.slice(-35) : s.key}</span>
                          {s.model && <span>• {s.model}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right flex-shrink-0 ml-4">
                      <div>
                        <div className="text-sm font-mono">{formatTokens(s.totalTokens)}</div>
                        <div className="text-xs text-[#555]">tokens</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#888]">{timeAgo(s.updatedAt)}</div>
                        <div className="text-xs text-[#555]">updated</div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded history */}
                {isExpanded && (
                  <div className="ml-6 mt-1 mb-2 border-l-2 border-[#222] pl-4 space-y-2 max-h-80 overflow-y-auto">
                    {expandedHistory.length === 0 ? (
                      <p className="text-xs text-[#555] py-2">No messages</p>
                    ) : (
                      expandedHistory.map((msg: any, i: number) => {
                        const text =
                          typeof msg.content === "string"
                            ? msg.content
                            : Array.isArray(msg.content)
                              ? msg.content
                                  .filter((b: any) => b.type === "text")
                                  .map((b: any) => b.text)
                                  .join("\n")
                              : "";
                        const preview = text.length > 200 ? text.slice(0, 200) + "…" : text;
                        return (
                          <div key={i} className="text-xs">
                            <span className={`font-medium ${msg.role === "user" ? "text-blue-400" : "text-emerald-400"}`}>
                              {msg.role}:
                            </span>
                            <span className="text-[#888] ml-1 whitespace-pre-wrap">{preview}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
