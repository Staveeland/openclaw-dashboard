"use client";
import { useSystemStore } from "@/core/store/useSystemStore";
import { Activity, Clock, Brain, Cpu } from "lucide-react";

export function SystemWidget() {
  const { sessions, cronJobs, systemHealth } = useSystemStore();

  const stats = [
    { label: "Sessions", value: sessions.length, icon: Activity, color: "text-emerald-500" },
    { label: "Cron Jobs", value: cronJobs.length, icon: Clock, color: "text-blue-500" },
    { label: "Uptime", value: systemHealth?.health?.uptime ? `${Math.floor(systemHealth.health.uptime / 60)}m` : "—", icon: Brain, color: "text-purple-500" },
    { label: "Status", value: systemHealth?.health?.ok ? "Online" : systemHealth ? "Degraded" : "—", icon: Cpu, color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-2.5 p-2">
            <Icon className={`w-4 h-4 ${s.color}`} />
            <div>
              <div className="text-lg font-bold leading-tight">{s.value}</div>
              <div className="text-xs text-[#888]">{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
