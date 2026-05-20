import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTenants, upsertTenant, setTenantActive, deleteTenant } from "@/lib/tenants.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { Plus, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Rent Manager" }] }),
  component: TenantsPage,
});

function TenantsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTenants);
  const upsertFn = useServerFn(upsertTenant);
  const setActiveFn = useServerFn(setTenantActive);
  const delFn = useServerFn(deleteTenant);
  const { data: tenants = [], isLoading } = useQuery({ queryKey: ["tenants"], queryFn: () => listFn() });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const openNew = () => { setEditing(null); setShowForm(true); };
  const openEdit = (t: any) => { setEditing(t); setShowForm(true); };

  const archive = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => setActiveFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Updated"); },
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tenants"] }); toast.success("Deleted"); },
    onError: (e: any) => toast.error(e.message),
  });

  const active = tenants.filter((t: any) => t.is_active);
  const archived = tenants.filter((t: any) => !t.is_active);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">Tenants</h1>
        <Button onClick={openNew} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" />Add tenant</Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      <TenantList title="Active" tenants={active} onEdit={openEdit} onArchive={(id: string) => archive.mutate({ id, is_active: false })} onDelete={(id: string) => del.mutate(id)} />
      {archived.length > 0 && (
        <TenantList title="Archived" tenants={archived} onEdit={openEdit} onReactivate={(id: string) => archive.mutate({ id, is_active: true })} onDelete={(id: string) => del.mutate(id)} />
      )}

      <TenantFormDialog open={showForm} onOpenChange={setShowForm} initial={editing}
        onSave={async (v: any) => {
          await upsertFn({ data: v });
          qc.invalidateQueries({ queryKey: ["tenants"] });
          setShowForm(false);
          toast.success("Saved");
        }} />
    </div>
  );
}

function TenantList({ title, tenants, onEdit, onArchive, onReactivate, onDelete }: any) {
  if (tenants.length === 0) return null;
  return (
    <Card className="p-3 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold mb-3">{title} ({tenants.length})</h2>
      <div className="space-y-2">
        {tenants.map((t: any) => (
          <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-md border">
            <Link to="/tenants/$tenantId" params={{ tenantId: t.id }} className="flex-1 min-w-0">
              <div className="font-medium text-sm sm:text-base truncate">{t.name}</div>
              <div className="text-xs sm:text-sm text-muted-foreground truncate">Room {t.room_number ?? "—"} {t.phone ? `· ${t.phone}` : ""}</div>
            </Link>
            <div className="flex gap-0.5 flex-wrap sm:gap-1 sm:flex-nowrap flex-shrink-0">
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => onEdit(t)}>Edit</Button>
              {onArchive && <Button variant="ghost" size="icon" title="Archive" className="h-8 w-8"><Archive className="h-4 w-4" /></Button>}
              {onReactivate && <Button variant="ghost" size="icon" title="Reactivate" className="h-8 w-8"><ArchiveRestore className="h-4 w-4" /></Button>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (confirm(`Delete ${t.name}? This removes all bills and payments.`)) onDelete(t.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TenantFormDialog({ open, onOpenChange, initial, onSave }: any) {
  const [name, setName] = useState(initial?.name ?? "");
  const [room, setRoom] = useState(initial?.room_number ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [moveIn, setMoveIn] = useState(initial?.move_in_date_bs ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Reset when initial changes
  useState(() => {
    setName(initial?.name ?? ""); setRoom(initial?.room_number ?? "");
    setPhone(initial?.phone ?? ""); setMoveIn(initial?.move_in_date_bs ?? "");
    setNotes(initial?.notes ?? "");
  });

  const submit = (e: any) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    onSave({
      id: initial?.id,
      name: name.trim(),
      room_number: room.trim() || null,
      phone: phone.trim() || null,
      move_in_date_bs: moveIn.trim() || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      onOpenChange(o);
      if (o) {
        setName(initial?.name ?? ""); setRoom(initial?.room_number ?? "");
        setPhone(initial?.phone ?? ""); setMoveIn(initial?.move_in_date_bs ?? "");
        setNotes(initial?.notes ?? "");
      }
    }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? "Edit tenant" : "Add tenant"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><FieldLabel help={HELP.tenantName} required>Name</FieldLabel><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><FieldLabel help={HELP.tenantRoom}>Room</FieldLabel><Input value={room} onChange={(e) => setRoom(e.target.value)} /></div>
          <div><FieldLabel help={HELP.tenantPhone}>Phone</FieldLabel><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div><FieldLabel help={HELP.tenantMoveIn}>Move-in date (BS)</FieldLabel><Input placeholder="2081-04-15" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} /></div>
          <div><FieldLabel help={HELP.tenantNotes}>Notes</FieldLabel><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
          <DialogFooter><Button type="submit">Save</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
