"use client";
import { Brain } from "lucide-react";
import Link from "next/link";

export function MemoryWidget() {
  return (
    <Link href="/dashboard/memory" className="block text-center py-4 hover:bg-[#1a1a1a] rounded-lg transition-colors">
      <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500 opacity-60" />
      <p className="text-sm text-[#888]">Search agent memory</p>
    </Link>
  );
}
