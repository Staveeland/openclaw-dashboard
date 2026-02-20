import type { DashboardPlugin } from "./types";
import { SystemPlugin } from "@/plugins/system";
import { SessionsPlugin } from "@/plugins/sessions";
import { ChatPlugin } from "@/plugins/chat";
import { CronPlugin } from "@/plugins/cron";
import { LogsPlugin } from "@/plugins/logs";

// New plugins just get added here
// Memory plugin removed — no file-read RPC available on the gateway
const ALL_PLUGINS: DashboardPlugin[] = [
  SystemPlugin,
  SessionsPlugin,
  ChatPlugin,
  CronPlugin,
  LogsPlugin,
];

export function getActivePlugins(
  gatewayCapabilities: string[]
): DashboardPlugin[] {
  return ALL_PLUGINS.filter((plugin) =>
    plugin.requiredCapabilities.every((cap) =>
      gatewayCapabilities.includes(cap)
    )
  );
}

export { ALL_PLUGINS as plugins };
