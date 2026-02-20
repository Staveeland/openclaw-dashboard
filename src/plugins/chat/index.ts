import { MessagesSquare } from "lucide-react";
import type { DashboardPlugin } from "@/core/registry/types";
import { ChatWidget } from "./ChatWidget";
import { ChatPage } from "./ChatPage";

export const ChatPlugin: DashboardPlugin = {
  id: "chat",
  name: "Chat",
  icon: MessagesSquare,
  requiredCapabilities: ["agent.send"],
  WidgetComponent: ChatWidget,
  PageComponent: ChatPage,
};
