import { Brain } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { MemoryWidget } from "./MemoryWidget";
import { MemoryPage } from "./MemoryPage";

export const MemoryPlugin: DashboardPlugin = {
  id: "memory",
  name: "Memory",
  icon: Brain,
  requiredCapabilities: ["memory.search"],
  WidgetComponent: MemoryWidget,
  PageComponent: MemoryPage,
};
