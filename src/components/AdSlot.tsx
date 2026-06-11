/**
 * AdSlot.tsx — renders a Google AdSense unit only when ads are enabled
 * by the super admin (app_settings.ads). Fails silent: if ads are off,
 * misconfigured, or blocked, it renders nothing and never breaks layout.
 */
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdsSettings } from "@/lib/subscription.functions";

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

let scriptLoaded = false;
function loadAdSenseScript(clientId: string) {
  if (scriptLoaded || typeof document === "undefined") return;
  scriptLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
}

export function AdSlot({ placement, className = "" }: { placement: "dashboard" | "landing"; className?: string }) {
  const adsFn = useServerFn(getAdsSettings);
  const pushed = useRef(false);

  const { data: ads } = useQuery({
    queryKey: ["ads-settings"],
    queryFn: () => adsFn(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const slot = placement === "dashboard" ? ads?.slot_dashboard : ads?.slot_landing;
  const enabled = !!ads?.enabled && !!ads?.client_id && !!slot;

  useEffect(() => {
    if (!enabled || pushed.current) return;
    loadAdSenseScript(ads!.client_id);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch { /* ad blocked — ignore */ }
  }, [enabled, ads]);

  if (!enabled) return null;

  return (
    <div className={`no-print w-full overflow-hidden ${className}`} aria-label="Advertisement">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 text-center mb-1">Advertisement</p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ads!.client_id}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
