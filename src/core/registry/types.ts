import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface DashboardPlugin {
  id: string;
  name: string;
  description?: string;
  icon: LucideIcon;
  requiredCapabilities: string[];
  WidgetComponent?: ComponentType;
  PageComponent?: ComponentType;
}
