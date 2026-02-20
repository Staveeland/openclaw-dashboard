import { LayoutDashboard } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { SystemWidget } from "./SystemWidget";
import { SystemPage } from "./SystemPage";

export const SystemPlugin: DashboardPlugin = {
  id: "system",
  name: "Overview",
  icon: LayoutDashboard,
  requiredCapabilities: [],
  WidgetComponent: SystemWidget,
  PageComponent: SystemPage,
};
