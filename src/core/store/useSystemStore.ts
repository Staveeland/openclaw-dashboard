"use client";
import { create } from "zustand";

export interface Session {
  key: string;
  kind?: string;
  model?: string;
  tokens?: string;
  age?: string;
  [key: string]: any;
}

export interface CronJob {
  id?: string;
  name: string;
  schedule?: string;
  lastRun?: string;
  status?: string;
  [key: string]: any;
}

interface SystemState {
  capabilities: string[];
  sessions: Session[];
  cronJobs: CronJob[];
  systemHealth: any;
  setCapabilities: (caps: string[]) => void;
  setSessions: (sessions: Session[]) => void;
  setCronJobs: (jobs: CronJob[]) => void;
  setSystemHealth: (health: any) => void;
  clear: () => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  capabilities: [],
  sessions: [],
  cronJobs: [],
  systemHealth: null,
  setCapabilities: (capabilities) => set({ capabilities }),
  setSessions: (sessions) => set({ sessions }),
  setCronJobs: (cronJobs) => set({ cronJobs }),
  setSystemHealth: (systemHealth) => set({ systemHealth }),
  clear: () =>
    set({ capabilities: [], sessions: [], cronJobs: [], systemHealth: null }),
}));
