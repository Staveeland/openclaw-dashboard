"use client";
import { useSystemStore } from "@/core/store/useSystemStore";
import { Activity, Clock, Brain, Cpu } from "lucide-react";

export function SystemPage() {
  const { sessions, cronJobs, systemHealth } = useSystemStore();

  const stats = [
    { label: "Active Sessions", value: sessions.length, icon: Activity, color: "emerald" },
    { label: "Cron Jobs", value: cronJobs.length, icon: Clock, color: "blue" },
    { label: "Memory Files", value: systemHealth?.memory?.files || "—", icon: Brain, color: "purple" },
    { label: "Gateway", value: systemHealth ? "Online" : "Unknown", icon: Cpu, color: "emerald" },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#888] text-sm">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 text-${stat.color}-500`} />
                </div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {Object.entries(systemHealth)
              .filter(([k]) => typeof systemHealth[k] === "string")
              .slice(0, 8)
              .map(([key, val]) => (
                <div key={key} className="flex justify-between py-2 border-b border-[#222]">
                  <span className="text-[#888] capitalize">{key}</span>
                  <span className="font-mono text-xs">{String(val)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-[#888] text-sm">No sessions found.</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-sm truncate max-w-[300px]">{s.key}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#888]">
                  <span>{s.model || "—"}</span>
                  <span>{s.age || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
