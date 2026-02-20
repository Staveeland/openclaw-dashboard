"use client";
import { MessagesSquare } from "lucide-react";
import Link from "next/link";

export function ChatWidget() {
  return (
    <Link href="/dashboard/chat" className="block text-center py-4 hover:bg-[#1a1a1a] rounded-lg transition-colors">
      <MessagesSquare className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
      <p className="text-sm text-[#888]">Open chat to talk to your agent</p>
    </Link>
  );
}
