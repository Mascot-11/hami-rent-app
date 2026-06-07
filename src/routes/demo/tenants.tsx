import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getDemoStore, saveDemoStore, type DemoTenant } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FieldLabel } from "@/components/HelpTip";
import { Plus, Archive, ArchiveRestore, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "crypto";

export const Route = createFileRoute("/demo/tenants")({
  head: () => ({ meta: [{ title: "Tenants (Demo) — Hamro Rent" }] }),
  component: DemoTenantsPage,
});

function newId() {
  return "demo-" + Math.random().toString(36).slice(2, 10);
}

function DemoTenantsPage() {
  const [store, setStore] = useState(() => getDemoStore()!);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DemoTenant | null>(null);
  const [form, setForm] = useState({ name: "", room_number: "", phone: "", notes: "" });

  const save = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    let next = { ...store };
    if (editing) {
      next.tenants = next.tenants.map((t) =>
        t.id === editing.id ? { ...t, ...form } : t
      );
      toast.success("Tenant updated");
    } else {
      const tenant: DemoTenant = {
        id: newId(), name: form.name.trim(),
        room_number: form.room_number || null, phone: form.phone || null,
        move_in_date_bs: null, notes: form.notes || null,
        is_active: true, created_at: new Date().toISOString(),
      };
      next.tenants = [...next.tenants, tenant];
      toast.success("Tenant added");
    }
    saveDemoStore(next);
    setStore(next);
    setOpen(false);
    setEditing(null);
    setForm({ name: "", room_number: "", phone: "", notes: "" });
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", room_number: "", phone: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (t: DemoTenant) => {
    setEditing(t);
    setForm({ name: t.name, room_number: t.room_number ?? "", phone: t.phone ?? "", notes: t.notes ?? "" });
    setOpen(true);
  };

  const toggleActive = (id: string) => {
    const next = { ...store, tenants: store.tenants.map((t) => t.id === id ? { ...t, is_active: !t.is_active } : t) };
    saveDemoStore(next);
    setStore(next);
    toast.success("Updated");
  };

  const remove = (id: string) => {
    if (!confirm("Delete this tenant?")) return;
    const next = { ...store, tenants: store.tenants.filter((t) => t.id !== id) };
    saveDemoStore(next);
    setStore(next);
    toast.success("Deleted");
  };

  const active = store.tenants.filter((t) => t.is_active);
  const archived = store.tenants.filter((t) => !t.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Tenants</h1>
          <p className="text-sm text-muted-foreground">{active.length} active</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add tenant
        </Button>
      </div>

      <Card className="divide-y divide-border">
        {active.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No active tenants. <button onClick={openAdd} className="text-primary hover:underline">Add one</button>
          </div>
        )}
        {active.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors">
            <button onClick={() => openEdit(t)} className="flex items-center gap-3 min-w-0 text-left">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {t.name[0]}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.room_number ? `Room ${t.room_number}` : "No room"}
                  {t.phone ? ` · ${t.phone}` : ""}
                </div>
              </div>
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <Link to="/demo/bills/new" className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="New bill">
                <Receipt className="h-4 w-4" />
              </Link>
              <button onClick={() => toggleActive(t.id)} className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors" title="Archive">
                <Archive className="h-4 w-4" />
              </button>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </Card>

      {archived.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Archived</h3>
          <Card className="divide-y divide-border">
            {archived.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3 opacity-60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">{t.name[0]}</div>
                  <div className="text-sm">{t.name} {t.room_number ? `· Room ${t.room_number}` : ""}</div>
                </div>
                <button onClick={() => toggleActive(t.id)} className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors" title="Restore">
                  <ArchiveRestore className="h-4 w-4" />
                </button>
              </div>
            ))}
          </Card>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit tenant" : "Add tenant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <FieldLabel required>Name</FieldLabel>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div>
              <FieldLabel>Room / Unit</FieldLabel>
              <Input value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} placeholder="e.g. 101, Ground floor" />
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
            </div>
            <div>
              <FieldLabel>Notes</FieldLabel>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add tenant"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
