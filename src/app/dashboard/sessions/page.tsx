"use client";
import { useSystemStore } from "@/core/store/useSystemStore";
import { Activity } from "lucide-react";

export default function SessionsPage() {
  const sessions = useSystemStore((s) => s.sessions);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold">Sessions</h1>
        <span className="text-sm text-[#888] bg-[#111] px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#222] text-[#888] text-left">
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">
                Kind
              </th>
              <th className="px-4 py-3 font-medium">Model</th>
              <th className="px-4 py-3 font-medium hidden lg:table-cell">
                Tokens
              </th>
              <th className="px-4 py-3 font-medium text-right">Age</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#888]">
                  No sessions found
                </td>
              </tr>
            ) : (
              sessions.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-[#1a1a1a] hover:bg-[#111] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-mono text-xs truncate max-w-[250px]">
                        {s.key}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#888] hidden md:table-cell">
                    {s.kind || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {s.model || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#888] hidden lg:table-cell">
                    {s.tokens || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[#888] text-xs">
                    {s.age || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
