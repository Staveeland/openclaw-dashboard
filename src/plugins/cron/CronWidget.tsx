"use client";
import { useSystemStore } from "@/core/store/useSystemStore";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export function CronWidget() {
  const cronJobs = useSystemStore((s) => s.cronJobs);

  if (cronJobs.length === 0) {
    return <p className="text-[#888] text-sm">No cron jobs</p>;
  }

  return (
    <div className="space-y-2">
      {cronJobs.slice(0, 5).map((job, i) => (
        <div key={i} className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            {job.status === "error" || job.status === "failed" ? (
              <XCircle className="w-3 h-3 text-red-400" />
            ) : job.status === "success" || job.status === "ok" ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <Clock className="w-3 h-3 text-[#888]" />
            )}
            <span className="text-sm truncate max-w-[180px]">{job.name}</span>
          </div>
          {job.schedule && (
            <span className="text-xs text-[#888] font-mono">
              {typeof job.schedule === "string"
                ? job.schedule
                : job.schedule?.expr || job.schedule?.kind || "—"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
