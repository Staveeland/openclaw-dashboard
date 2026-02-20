import {
  Activity,
  MessagesSquare,
  Clock,
  Brain,
  LayoutDashboard,
} from "lucide-react";
import type { PluginManifest } from "./types";

export const plugins: PluginManifest[] = [
  {
    id: "system",
    name: "Overview",
    description: "System status and health",
    icon: LayoutDashboard,
    requiredCapabilities: [],
    path: "/dashboard",
  },
  {
    id: "sessions",
    name: "Sessions",
    description: "Active conversation sessions",
    icon: Activity,
    requiredCapabilities: ["sessions.list"],
    path: "/dashboard/sessions",
  },
  {
    id: "chat",
    name: "Chat",
    description: "Chat with your agent",
    icon: MessagesSquare,
    requiredCapabilities: ["agent.send"],
    path: "/dashboard/chat",
  },
  {
    id: "cron",
    name: "Cron Jobs",
    description: "Scheduled tasks",
    icon: Clock,
    requiredCapabilities: ["cron.list"],
    path: "/dashboard/cron",
  },
  {
    id: "memory",
    name: "Memory",
    description: "Search agent memory",
    icon: Brain,
    requiredCapabilities: ["memory.search"],
    path: "/dashboard/memory",
  },
];

export function getActivePlugins(capabilities: string[]): PluginManifest[] {
  return plugins.filter((p) =>
    p.requiredCapabilities.every((cap) => capabilities.includes(cap))
  );
}
