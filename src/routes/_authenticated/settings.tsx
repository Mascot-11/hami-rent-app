import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef } from "react";
import { exportAll, restoreBackup } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Rent Manager" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const expFn = useServerFn(exportAll);
  const restFn = useServerFn(restoreBackup);

  const backup = async () => {
    const data = await expFn();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rent-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Restore data from this file? Existing records with the same IDs will be updated.")) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await restFn({ data: parsed });
      toast.success("Restore complete. Reload the page.");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to restore");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-display">Settings</h1>
      <Card className="p-5 space-y-3">
        <FieldLabel help={HELP.backup}>Backup</FieldLabel>
        <Button onClick={backup}><Download className="h-4 w-4 mr-1.5" />Download JSON backup</Button>
      </Card>
      <Card className="p-5 space-y-3">
        <FieldLabel help={HELP.restore}>Restore</FieldLabel>
        <input ref={fileRef} type="file" accept="application/json" onChange={restore} className="hidden" />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1.5" />Choose JSON file
        </Button>
      </Card>
    </div>
  );
}
