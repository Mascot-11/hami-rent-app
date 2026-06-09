import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListTenants, adminDeleteTenant, adminUpdateTenant } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Admin" }] }),
  component: AdminTenants,
});

function AdminTenants() {
  const listFn   = useServerFn(adminListTenants);
  const deleteFn = useServerFn(adminDeleteTenant);
  const updateFn = useServerFn(adminUpdateTenant);
  const qc       = useQueryClient();
  const [search, setSearch]   = useState("");
  const [busy, setBusy]       = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm]       = useState({ name: "", room_number: "", phone: "", notes: "" });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: () => listFn(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-tenants"] });

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, room_number: t.room_number ?? "", phone: t.phone ?? "", notes: t.notes ?? "" });
  };

  const saveEdit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setBusy(editing.id);
    try {
      await updateFn({ data: { id: editing.id, ...form, room_number: form.room_number || null, phone: form.phone || null, notes: form.notes || null } });
      toast.success("Tenant updated");
      setEditing(null);
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete tenant "${name}" and all their bills/payments?`)) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("Deleted");
      refresh();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  const filtered = (tenants as any[]).filter((t) =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.room_number ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> All Tenants
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(tenants as any[]).length} tenants across all landlords
          </p>
        </div>
        <input
          type="text"
          placeholder="Search name or room…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
        />
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Name", "Room", "Phone", "Move-in (BS)", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.room_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.move_in_date_bs ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="h-7 text-xs gap-1">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" disabled={busy === t.id} onClick={() => del(t.id, t.name)} className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No tenants found.</div>
            )}
          </div>
        )}
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tenant</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><label className="text-xs text-muted-foreground">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Room</label><Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Notes</label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy === editing?.id}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
