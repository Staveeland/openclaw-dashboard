"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  gatewayUrl: string;
  token: string;
  isConnected: boolean;
  setCredentials: (url: string, token: string) => void;
  setConnected: (connected: boolean) => void;
  disconnect: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      gatewayUrl: "ws://127.0.0.1:18789",
      token: "",
      isConnected: false,
      setCredentials: (gatewayUrl, token) => set({ gatewayUrl, token }),
      setConnected: (isConnected) => set({ isConnected }),
      disconnect: () => set({ token: "", isConnected: false }),
    }),
    { name: "openclaw-auth" }
  )
);
