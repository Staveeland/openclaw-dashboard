"use client";
import { TerminalSquare } from "lucide-react";
import Link from "next/link";

export function LogsWidget() {
  return (
    <Link href="/dashboard/logs" className="block text-center py-4 hover:bg-[#1a1a1a] rounded-lg transition-colors">
      <TerminalSquare className="w-8 h-8 mx-auto mb-2 text-cyan-500 opacity-60" />
      <p className="text-sm text-[#888]">Live gateway logs</p>
    </Link>
  );
}
