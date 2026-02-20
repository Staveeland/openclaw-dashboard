import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  requiredCapabilities: string[];
  Widget?: ComponentType;
  path: string;
}
