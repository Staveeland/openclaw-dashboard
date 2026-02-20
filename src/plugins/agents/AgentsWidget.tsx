"use client";
import { useEffect, useState } from "react";
import { rpcClient } from "@/core/ws/rpc-client";
import { Bot, Loader2 } from "lucide-react";

export function AgentsWidget() {
  const [counts, setCounts] = useState({ total: 0, active: 0, cron: 0, spawned: 0 });

  useEffect(() => {
    async function fetch() {
      try {
        const res: any = await rpcClient.request("sessions.list", { limit: 100, activeMinutes: 60 });
        const ss = res?.sessions || [];
        setCounts({
          total: ss.length,
          active: ss.filter((s: any) => s.totalTokens > 0).length,
          cron: ss.filter((s: any) => s.key?.includes("cron")).length,
          spawned: ss.filter((s: any) => s.spawned).length,
        });
      } catch {}
    }
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-2">
        <div className="text-lg font-bold">{counts.total}</div>
        <div className="text-xs text-[#888]">Sessions (1h)</div>
      </div>
      <div className="p-2">
        <div className="text-lg font-bold">{counts.active}</div>
        <div className="text-xs text-[#888]">Active</div>
      </div>
      <div className="p-2">
        <div className="text-lg font-bold">{counts.cron}</div>
        <div className="text-xs text-[#888]">Cron Jobs</div>
      </div>
      <div className="p-2">
        <div className="text-lg font-bold text-purple-400">{counts.spawned}</div>
        <div className="text-xs text-[#888]">Sub-Agents</div>
      </div>
    </div>
  );
}
