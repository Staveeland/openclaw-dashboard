"use client";
import { useSystemStore } from "@/core/store/useSystemStore";
import { getActivePlugins } from "@/core/registry/plugin-registry";

export default function DashboardHome() {
  const capabilities = useSystemStore((s) => s.capabilities);
  const activePlugins = getActivePlugins(capabilities);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activePlugins.map((plugin) => {
          if (!plugin.WidgetComponent) return null;
          const Widget = plugin.WidgetComponent;
          const Icon = plugin.icon;
          return (
            <div
              key={plugin.id}
              className="card p-5 flex flex-col"
            >
              <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-emerald-500" />
                {plugin.name}
              </h2>
              <div className="flex-1 overflow-auto">
                <Widget />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
