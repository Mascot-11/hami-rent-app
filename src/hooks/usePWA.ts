/**
 * usePWA.ts
 * Registers the service worker, tracks online/offline state,
 * captures the beforeinstallprompt event, and triggers sync.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { fullSync } from "@/lib/sync-engine";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAState {
  /** Is the browser currently online? */
  isOnline: boolean;
  /** Is the SW installed and active? */
  swReady: boolean;
  /** Can we show the install prompt? (Android/Chrome) */
  canInstall: boolean;
  /** Is the app already installed (standalone mode)? */
  isInstalled: boolean;
  /** Number of unsynced items waiting in the queue */
  pendingSync: number;
  /** Trigger install prompt */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  /** Manually trigger a full sync */
  triggerSync: () => Promise<void>;
  /** Last successful sync timestamp */
  lastSynced: Date | null;
}

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swReady, setSwReady] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  const isInstalled =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // ── Service Worker registration ────────────────────────────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setSwReady(true);
        console.log("[pwa] SW registered", reg.scope);

        // Listen for messages from SW (background sync trigger)
        navigator.serviceWorker.addEventListener("message", (e) => {
          if (e.data?.type === "BACKGROUND_SYNC") {
            triggerSync();
          }
        });
      })
      .catch((err) => console.error("[pwa] SW registration failed", err));
  }, []);

  // ── Online / offline events ────────────────────────────────────────────────
  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      // Register background sync if available
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        try {
          await (reg as ServiceWorkerRegistration & {
            sync: { register(tag: string): Promise<void> };
          }).sync.register("hamro-rent-sync");
        } catch {
          // Fallback: sync directly
          triggerSync();
        }
      } else {
        triggerSync();
      }
    };

    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ── Install prompt ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const handler = () => setCanInstall(false);
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  // ── Sync ───────────────────────────────────────────────────────────────────
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    try {
      await fullSync();
      setLastSynced(new Date());
      // Refresh pending count
      const { offlineDB } = await import("@/lib/offline-db");
      const q = await offlineDB.getQueue();
      setPendingSync(q.length);
    } catch (err) {
      console.error("[pwa] Sync error", err);
    }
  }, []);

  // Initial sync on mount if online
  useEffect(() => {
    if (isOnline) {
      triggerSync();
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    if (!deferredPrompt.current) return "unavailable";
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    return outcome;
  }, []);

  return {
    isOnline,
    swReady,
    canInstall,
    isInstalled,
    pendingSync,
    promptInstall,
    triggerSync,
    lastSynced,
  };
}
