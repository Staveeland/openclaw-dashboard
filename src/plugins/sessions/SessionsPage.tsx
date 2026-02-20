"use client";
import { useSystemStore } from "@/core/store/useSystemStore";

export function SessionsPage() {
  const sessions = useSystemStore((s) => s.sessions);

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#222] text-[#888] text-left">
            <th className="px-4 py-3 font-medium">Key</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">Kind</th>
            <th className="px-4 py-3 font-medium">Model</th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">Tokens</th>
            <th className="px-4 py-3 font-medium text-right">Age</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-[#888]">No sessions found</td>
            </tr>
          ) : (
            sessions.map((s, i) => (
              <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-mono text-xs truncate max-w-[250px]">{s.key}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#888] hidden md:table-cell">{s.kind || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{s.model || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#888] hidden lg:table-cell">{s.tokens || "—"}</td>
                <td className="px-4 py-3 text-right text-[#888] text-xs">{s.age || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
