"use client";
import { use } from "react";
import { useSystemStore } from "@/core/store/useSystemStore";
import { getActivePlugins } from "@/core/registry/plugin-registry";
import { notFound } from "next/navigation";

export default function PluginPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const { pluginId } = use(params);
  const capabilities = useSystemStore((s) => s.capabilities);
  const activePlugins = getActivePlugins(capabilities);
  const plugin = activePlugins.find((p) => p.id === pluginId);

  if (!plugin || !plugin.PageComponent) return notFound();

  const Page = plugin.PageComponent;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <plugin.icon className="w-6 h-6 text-emerald-500" />
        <h1 className="text-2xl font-bold">{plugin.name}</h1>
      </div>
      <Page />
    </div>
  );
}
