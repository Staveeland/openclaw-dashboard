import { Activity } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { SessionsWidget } from "./SessionsWidget";
import { SessionsPage } from "./SessionsPage";

export const SessionsPlugin: DashboardPlugin = {
  id: "sessions",
  name: "Sessions",
  icon: Activity,
  requiredCapabilities: ["sessions.list"],
  WidgetComponent: SessionsWidget,
  PageComponent: SessionsPage,
};
