import { TerminalSquare } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { LogsWidget } from "./LogsWidget";
import { LogsPage } from "./LogsPage";

export const LogsPlugin: DashboardPlugin = {
  id: "logs",
  name: "Logs",
  icon: TerminalSquare,
  requiredCapabilities: ["logs.tail"],
  WidgetComponent: LogsWidget,
  PageComponent: LogsPage,
};
