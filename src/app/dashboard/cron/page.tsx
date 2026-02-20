"use client";
import { useSystemStore } from "@/core/store/useSystemStore";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function CronPage() {
  const cronJobs = useSystemStore((s) => s.cronJobs);

  function getStatusIcon(status?: string) {
    if (!status) return <Clock className="w-4 h-4 text-[#888]" />;
    if (status === "success" || status === "ok")
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === "error" || status === "failed")
      return <XCircle className="w-4 h-4 text-red-400" />;
    return <AlertCircle className="w-4 h-4 text-amber-400" />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold">Cron Jobs</h1>
        <span className="text-sm text-[#888] bg-[#111] px-2 py-0.5 rounded-full">
          {cronJobs.length}
        </span>
      </div>

      {cronJobs.length === 0 ? (
        <div className="card p-8 text-center text-[#888]">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No cron jobs found</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cronJobs.map((job, i) => (
            <div
              key={i}
              className="card p-4 flex items-center justify-between hover:border-[#333] transition-colors"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(job.status)}
                <div>
                  <div className="font-medium text-sm">{job.name}</div>
                  {job.schedule && (
                    <div className="text-xs text-[#888] font-mono mt-0.5">
                      {job.schedule}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {job.lastRun && (
                  <div className="text-xs text-[#888]">{job.lastRun}</div>
                )}
                {job.status && (
                  <div
                    className={`text-xs mt-0.5 ${
                      job.status === "success" || job.status === "ok"
                        ? "text-emerald-400"
                        : job.status === "error" || job.status === "failed"
                          ? "text-red-400"
                          : "text-amber-400"
                    }`}
                  >
                    {job.status}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
