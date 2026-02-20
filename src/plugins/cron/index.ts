import { Clock } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { CronWidget } from "./CronWidget";
import { CronPage } from "./CronPage";

export const CronPlugin: DashboardPlugin = {
  id: "cron",
  name: "Cron Jobs",
  icon: Clock,
  requiredCapabilities: ["cron.list"],
  WidgetComponent: CronWidget,
  PageComponent: CronPage,
};
