"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/core/store/useAuthStore";
import { useSystemStore } from "@/core/store/useSystemStore";
import { rpcClient } from "@/core/ws/rpc-client";
import { plugins } from "@/core/registry/plugin-registry";
import { Zap, LogOut, Menu, X, Wifi, WifiOff } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { gatewayUrl, token, isConnected, setConnected, disconnect } =
    useAuthStore();
  const { setCapabilities, setSessions, setCronJobs, setSystemHealth, clear } =
    useSystemStore();
  const capabilities = useSystemStore((s) => s.capabilities);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/connect");
      return;
    }

    async function init() {
      try {
        if (!rpcClient.connected) {
          await rpcClient.connect(gatewayUrl, token);
        }
        setConnected(true);

        // Discover capabilities
        try {
          const status: any = await rpcClient.request("system.status");
          const caps = status?.capabilities || [
            "sessions.list",
            "agent.send",
            "cron.list",
            "memory.search",
          ];
          setCapabilities(caps);
          setSystemHealth(status);
        } catch {
          // If system.status not available, assume all capabilities
          setCapabilities([
            "sessions.list",
            "agent.send",
            "cron.list",
            "memory.search",
          ]);
        }

        // Fetch sessions
        try {
          const res: any = await rpcClient.request("sessions.list", {
            limit: 50,
          });
          setSessions(res?.sessions || res || []);
        } catch {}

        // Fetch cron
        try {
          const res: any = await rpcClient.request("cron.list");
          setCronJobs(res?.jobs || res || []);
        } catch {}
      } catch {
        setConnected(false);
      }
    }

    init();

    const unsub = rpcClient.on("_connection", (data: any) => {
      setConnected(data.status === "connected");
    });

    return () => unsub();
  }, [token, gatewayUrl]);

  function handleDisconnect() {
    rpcClient.disconnect();
    disconnect();
    clear();
    router.replace("/connect");
  }

  // Filter plugins by capabilities
  const activePlugins = plugins.filter((p) =>
    p.requiredCapabilities.every((cap) => capabilities.includes(cap))
  );

  return (
    <div className="min-h-screen flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#111] border border-[#222]"
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col transform transition-transform lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">OpenClaw</h2>
              <p className="text-[10px] text-[#555]">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {activePlugins.map((plugin) => {
            const Icon = plugin.icon;
            const active = pathname === plugin.path;
            return (
              <Link
                key={plugin.id}
                href={plugin.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {plugin.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[#1a1a1a] space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-400">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-red-400">Disconnected</span>
              </>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#888] hover:text-red-400 hover:bg-red-400/5 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 min-h-screen lg:ml-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
