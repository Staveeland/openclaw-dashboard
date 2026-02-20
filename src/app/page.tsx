"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for zustand persist to hydrate from localStorage
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { token } = useAuthStore.getState();
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/connect");
    }
  }, [hydrated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-[#888]">Loading...</div>
    </div>
  );
}
