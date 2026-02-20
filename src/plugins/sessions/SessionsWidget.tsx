"use client";
import { useSystemStore } from "@/core/store/useSystemStore";

export function SessionsWidget() {
  const sessions = useSystemStore((s) => s.sessions);

  return (
    <div className="space-y-2">
      {sessions.length === 0 ? (
        <p className="text-[#888] text-sm">No sessions</p>
      ) : (
        sessions.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs truncate max-w-[180px]">{s.key}</span>
            </div>
            <span className="text-xs text-[#888]">{s.model || "—"}</span>
          </div>
        ))
      )}
    </div>
  );
}
