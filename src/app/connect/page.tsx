"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/store/useAuthStore";
import { rpcClient } from "@/core/ws/rpc-client";
import { Zap, Loader2, AlertCircle } from "lucide-react";

export default function ConnectPage() {
  const router = useRouter();
  const { gatewayUrl, setCredentials, setConnected } = useAuthStore();
  const [url, setUrl] = useState(gatewayUrl || "ws://127.0.0.1:18789");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isInsecureRemote =
    url.startsWith("ws://") &&
    !url.includes("127.0.0.1") &&
    !url.includes("localhost");

  async function handleConnect() {
    setError("");
    setLoading(true);
    try {
      await rpcClient.connect(url, token);
      setCredentials(url, token);
      setConnected(true);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#0d1117] to-[#0a0a0a]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Zap className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">OpenClaw Dashboard</h1>
          <p className="text-[#888] mt-2">Connect to your gateway</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-sm text-[#888] mb-1.5">
              Gateway URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://127.0.0.1:18789"
              className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-lg text-white placeholder-[#555] focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
            />
            {isInsecureRemote && (
              <p className="text-amber-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Non-localhost ws:// may be blocked. Use wss:// or a tunnel.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#888] mb-1.5">Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Gateway auth token"
              className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-lg text-white placeholder-[#555] focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !token}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect"
            )}
          </button>
        </div>

        <p className="text-center text-[#555] text-xs mt-6">
          Your data stays between your browser and your gateway.
        </p>
      </div>
    </div>
  );
}
