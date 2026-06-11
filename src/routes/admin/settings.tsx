import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetAdsSettings, adminUpdateAdsSettings } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Megaphone, Settings } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const getFn = useServerFn(adminGetAdsSettings);
  const saveFn = useServerFn(adminUpdateAdsSettings);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({ queryKey: ["admin-ads"], queryFn: () => getFn() });

  const [form, setForm] = useState({ enabled: false, client_id: "", slot_dashboard: "", slot_landing: "" });
  useEffect(() => {
    if (data?.value) {
      setForm({
        enabled: data.value.enabled === true,
        client_id: data.value.client_id ?? "",
        slot_dashboard: data.value.slot_dashboard ?? "",
        slot_landing: data.value.slot_landing ?? "",
      });
    }
  }, [data]);

  const save = async () => {
    setBusy(true);
    try {
      await saveFn({ data: form });
      toast.success("Ads settings saved");
      qc.invalidateQueries({ queryKey: ["admin-ads"] });
      qc.invalidateQueries({ queryKey: ["ads-settings"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Settings className="h-6 w-6" /> Platform settings
      </h1>

      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Website ads (Google AdSense)</p>
              <p className="text-xs text-muted-foreground">Show ad units on the landing page and dashboard footer</p>
            </div>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">AdSense client ID</span>
            <input
              value={form.client_id} placeholder="ca-pub-1234567890123456"
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value.trim() }))}
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm font-mono"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Dashboard slot ID</span>
            <input
              value={form.slot_dashboard} placeholder="1234567890"
              onChange={(e) => setForm((f) => ({ ...f, slot_dashboard: e.target.value.trim() }))}
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm font-mono"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-xs font-medium text-muted-foreground">Landing page slot ID</span>
            <input
              value={form.slot_landing} placeholder="0987654321"
              onChange={(e) => setForm((f) => ({ ...f, slot_landing: e.target.value.trim() }))}
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm font-mono"
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Ads only render when enabled <b>and</b> a client ID + slot ID are set. Bill share pages and printouts never show ads.
        </p>

        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
      </Card>
    </div>
  );
}
