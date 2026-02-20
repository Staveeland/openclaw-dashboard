import { Bot } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { AgentsWidget } from "./AgentsWidget";
import { AgentsPage } from "./AgentsPage";

export const AgentsPlugin: DashboardPlugin = {
  id: "agents",
  name: "Agents",
  icon: Bot,
  requiredCapabilities: ["sessions.list"],
  WidgetComponent: AgentsWidget,
  PageComponent: AgentsPage,
};
