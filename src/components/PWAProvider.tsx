/**
 * PWAProvider.tsx
 * Wraps the app to provide:
 *  - Install banner (Android) + iOS instructions
 *  - Offline indicator bar
 *  - Sync status badge
 */

import { createContext, useContext, type ReactNode } from "react";
import { usePWA, type PWAState } from "@/hooks/usePWA";
import { Download, WifiOff, RefreshCw, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PWAContext = createContext<PWAState | null>(null);

export function usePWAContext() {
  const ctx = useContext(PWAContext);
  if (!ctx) throw new Error("usePWAContext must be inside PWAProvider");
  return ctx;
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const pwa = usePWA();
  const [installDismissed, setInstallDismissed] = useState(false);
  // localStorage is not available during SSR — use a lazy initializer that
  // checks for the browser environment first.
  const [iosDismissed, setIosDismissed] = useState(() =>
    typeof window !== "undefined"
      ? !!localStorage.getItem("pwa-ios-dismissed")
      : false
  );

  // navigator / window are not available on the server — guard every access.
  const isIOS =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window.navigator as Navigator & { standalone?: boolean }).standalone;

  const handleInstall = async () => {
    const result = await pwa.promptInstall();
    if (result === "accepted") {
      toast.success("App installed! 🎉");
    } else if (result === "unavailable" && isIOS) {
      // show iOS instructions inline
    }
  };

  const dismissIOS = () => {
    localStorage.setItem("pwa-ios-dismissed", "1");
    setIosDismissed(true);
  };

  return (
    <PWAContext.Provider value={pwa}>
      {children}

      {/* ── Offline bar ─────────────────────────────────────────────────── */}
      {!pwa.isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 z-[200] flex items-center justify-center gap-2 bg-foreground text-background text-xs font-medium py-2.5 px-4 no-print"
        >
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
          <span>You're offline — changes will sync when you reconnect</span>
        </div>
      )}

      {/* ── Pending sync badge (if items queued after coming back online) ── */}
      {pwa.isOnline && pwa.pendingSync > 0 && (
        <div className="fixed bottom-4 right-4 z-[200] flex items-center gap-2 bg-warning text-warning-foreground text-xs font-medium py-2 px-3 rounded-full shadow-md no-print animate-in slide-in-from-bottom-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Syncing {pwa.pendingSync} change{pwa.pendingSync > 1 ? "s" : ""}…
        </div>
      )}

      {/* ── Android / Chrome install banner ─────────────────────────────── */}
      {pwa.canInstall && !pwa.isInstalled && !installDismissed && (
        <div className="fixed bottom-0 inset-x-0 z-[190] no-print">
          <div className="bg-card border-t border-border shadow-xl p-4 flex items-center gap-4 max-w-lg mx-auto rounded-t-2xl">
            <img src="/icon-72x72.png" alt="" className="h-12 w-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Install Hamro Rent</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add to home screen for offline access & faster loading
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Install
              </button>
              <button
                onClick={() => setInstallDismissed(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS install instructions ─────────────────────────────────────── */}
      {isIOS && !pwa.isInstalled && !iosDismissed && (
        <div className="fixed bottom-0 inset-x-0 z-[190] no-print">
          <div className="bg-card border-t border-border shadow-xl p-4 max-w-lg mx-auto rounded-t-2xl">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <img src="/icon-72x72.png" alt="" className="h-10 w-10 rounded-xl" />
                <div>
                  <p className="font-semibold text-sm">Install Hamro Rent</p>
                  <p className="text-xs text-muted-foreground">Works offline · No App Store needed</p>
                </div>
              </div>
              <button
                onClick={dismissIOS}
                className="p-1 rounded text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground text-sm">How to install on iPhone / iPad:</p>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Tap the <strong className="text-foreground">Share</strong> button (box with arrow) at the bottom of Safari</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Tap <strong className="text-foreground">Add</strong> — the app icon will appear on your home screen</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
