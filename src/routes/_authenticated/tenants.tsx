import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listTenants,
  upsertTenant,
  setTenantActive,
  deleteTenant,
} from "@/lib/tenants.functions";
import { listBills } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Plus,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { bsLabel } from "@/lib/bs-calendar";
import {
  computeBillTotal,
  computePaid,
  computeRemaining,
  computeStatus,
  fmtNPR,
  type BillStatus,
} from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/tenants")({
  head: () => ({ meta: [{ title: "Tenants — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: TenantsPage,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

function TenantsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTenants);
  const upsertFn = useServerFn(upsertTenant);
  const setActiveFn = useServerFn(setTenantActive);
  const delFn = useServerFn(deleteTenant);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listFn(),
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (t: any) => {
    setEditing(t);
    setShowForm(true);
  };

  const archive = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) =>
      setActiveFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Updated");
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const active = tenants.filter((t: any) => t.is_active);
  const archived = tenants.filter((t: any) => !t.is_active);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">Tenants</h1>
        <Button onClick={openNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1.5" />
          Add tenant
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      <TenantList
        title="Active"
        tenants={active}
        onEdit={openEdit}
        onArchive={(id: string) => archive.mutate({ id, is_active: false })}
        onDelete={(id: string) => del.mutate(id)}
      />

      {archived.length > 0 && (
        <TenantList
          title="Archived"
          tenants={archived}
          onEdit={openEdit}
          onReactivate={(id: string) => archive.mutate({ id, is_active: true })}
          onDelete={(id: string) => del.mutate(id)}
        />
      )}

      <TenantFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initial={editing}
        onSave={async (v: any) => {
          await upsertFn({ data: v });
          qc.invalidateQueries({ queryKey: ["tenants"] });
          setShowForm(false);
          toast.success("Saved");
        }}
      />
    </div>
  );
}

// ─── Tenant List ──────────────────────────────────────────────────────────────

function TenantList({
  title,
  tenants,
  onEdit,
  onArchive,
  onReactivate,
  onDelete,
}: any) {
  if (tenants.length === 0) return null;
  return (
    <Card className="p-3 sm:p-5">
      <h2 className="text-base sm:text-lg font-semibold mb-3">
        {title} ({tenants.length})
      </h2>
      <div className="space-y-2">
        {tenants.map((t: any) => (
          <TenantRow
            key={t.id}
            tenant={t}
            onEdit={onEdit}
            onArchive={onArchive}
            onReactivate={onReactivate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  );
}

// ─── Tenant Row ───────────────────────────────────────────────────────────────

function TenantRow({
  tenant: t,
  onEdit,
  onArchive,
  onReactivate,
  onDelete,
}: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Main row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3">
        <Link
          to="/tenants/$tenantId"
          params={{ tenantId: t.id }}
          className="flex-1 min-w-0"
        >
          <div className="font-medium text-sm sm:text-base truncate">{t.name}</div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">
            Room {t.room_number ?? "—"}
            {t.phone ? ` · ${t.phone}` : ""}
            {t.move_in_date_bs ? ` · Moved in: ${t.move_in_date_bs}` : ""}
          </div>
        </Link>

        <div className="flex gap-0.5 flex-wrap sm:gap-1 sm:flex-nowrap flex-shrink-0 items-center">
          {/* Bills toggle */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1"
            onClick={() => setExpanded((v) => !v)}
          >
            <Receipt className="h-3.5 w-3.5" />
            Bills
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => onEdit(t)}
          >
            Edit
          </Button>

          {onArchive && (
            <Button
              variant="ghost"
              size="icon"
              title="Archive"
              className="h-8 w-8"
              onClick={() => onArchive(t.id)}
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {onReactivate && (
            <Button
              variant="ghost"
              size="icon"
              title="Reactivate"
              className="h-8 w-8"
              onClick={() => onReactivate(t.id)}
            >
              <ArchiveRestore className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              if (
                confirm(
                  `Delete ${t.name}? This removes all bills and payments.`
                )
              )
                onDelete(t.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expandable bill history */}
      {expanded && (
        <TenantBillHistory tenantId={t.id} tenantName={t.name} />
      )}
    </div>
  );
}

// ─── Tenant Bill History ──────────────────────────────────────────────────────

function TenantBillHistory({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const listBillsFn = useServerFn(listBills);

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["tenant-bills", tenantId],
    queryFn: () => listBillsFn({ data: { tenant_id: tenantId } }),
    staleTime: 60_000,
  });

  // Enrich
  const enriched = (bills as any[]).map((b) => ({
    bill: b,
    total: computeBillTotal(b, b.additional_charges ?? []),
    paid: computePaid(b.payments ?? []),
    remaining: computeRemaining(b, b.additional_charges ?? [], b.payments ?? []),
    status: computeStatus(
      b,
      b.additional_charges ?? [],
      b.payments ?? []
    ) as BillStatus,
  }));
  // already sorted desc from server, but ensure it
  enriched.sort(
    (a, b) =>
      b.bill.bs_year !== a.bill.bs_year
        ? b.bill.bs_year - a.bill.bs_year
        : b.bill.bs_month - a.bill.bs_month
  );

  const totalBilled = enriched.reduce((s, e) => s + e.total, 0);
  const totalPaid = enriched.reduce((s, e) => s + e.paid, 0);
  const totalDue = enriched.reduce((s, e) => s + Math.max(0, e.remaining), 0);
  const paidCount = enriched.filter(
    (e) => e.status === "paid" || e.status === "overpaid"
  ).length;
  const pendingCount = enriched.filter(
    (e) => e.status === "pending" || e.status === "partial"
  ).length;

  return (
    <div className="border-t bg-muted/20 px-3 pb-3 pt-2">
      {isLoading ? (
        <p className="text-xs text-muted-foreground py-2">Loading bills…</p>
      ) : enriched.length === 0 ? (
        <div className="flex items-center justify-between py-2">
          <p className="text-xs text-muted-foreground">
            No bills found for {tenantName}.
          </p>
          <Link to="/bills/new" className="text-xs text-primary underline">
            Create first bill
          </Link>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3 pt-1">
            <span>
              {enriched.length} bill{enriched.length !== 1 ? "s" : ""}
            </span>
            <span>
              Paid:{" "}
              <strong className="text-green-600">{paidCount}</strong>
            </span>
            <span>
              Pending:{" "}
              <strong className="text-yellow-600">{pendingCount}</strong>
            </span>
            <span>
              Total billed:{" "}
              <strong className="text-foreground">{fmtNPR(totalBilled)}</strong>
            </span>
            <span>
              Collected:{" "}
              <strong className="text-foreground">{fmtNPR(totalPaid)}</strong>
            </span>
            {totalDue > 0 && (
              <span className="text-red-500 font-medium">
                Outstanding: {fmtNPR(totalDue)}
              </span>
            )}
            {totalDue === 0 && enriched.length > 0 && (
              <span className="text-green-600 font-medium">
                ✓ All cleared
              </span>
            )}
          </div>

          {/* Bill rows */}
          <div className="space-y-1.5">
            {enriched.map(({ bill: b, total, paid, remaining, status }) => (
              <Link
                key={b.id}
                to="/bills/$billId"
                params={{ billId: b.id }}
                className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 rounded-md bg-background border hover:bg-accent transition-colors text-sm"
              >
                {/* Month */}
                <div className="font-medium shrink-0 w-32 text-sm">
                  {bsLabel(b.bs_year, b.bs_month)}
                </div>

                {/* Amounts */}
                <div className="flex-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>
                    Rent:{" "}
                    <span className="text-foreground font-medium">
                      {fmtNPR(b.rent_this_month)}
                    </span>
                  </span>
                  <span>
                    Water:{" "}
                    <span className="text-foreground font-medium">
                      {fmtNPR(b.water_bill)}
                    </span>
                  </span>
                  <span>
                    Total:{" "}
                    <span className="text-foreground font-medium">
                      {fmtNPR(total)}
                    </span>
                  </span>
                  <span>
                    Paid:{" "}
                    <span className="text-foreground font-medium">
                      {fmtNPR(paid)}
                    </span>
                  </span>
                  {remaining > 0 && (
                    <span className="text-red-500 font-medium">
                      Due: {fmtNPR(remaining)}
                    </span>
                  )}
                  {remaining < 0 && (
                    <span className="text-green-600 font-medium">
                      Credit: {fmtNPR(Math.abs(remaining))}
                    </span>
                  )}
                  {b.notes && (
                    <span className="italic text-muted-foreground truncate max-w-xs">
                      · {b.notes}
                    </span>
                  )}
                </div>

                {/* Progress + status */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:block w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          total > 0 ? (paid / total) * 100 : 0
                        )}%`,
                      }}
                    />
                  </div>
                  <StatusBadge status={status} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function TenantFormDialog({ open, onOpenChange, initial, onSave }: any) {
  const [name, setName] = useState(initial?.name ?? "");
  const [room, setRoom] = useState(initial?.room_number ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [moveIn, setMoveIn] = useState(initial?.move_in_date_bs ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>(initial?.documents ?? []);
  const [uploading, setUploading] = useState(false);

  const reset = (t: any) => {
    setName(t?.name ?? "");
    setRoom(t?.room_number ?? "");
    setPhone(t?.phone ?? "");
    setMoveIn(t?.move_in_date_bs ?? "");
    setNotes(t?.notes ?? "");
    setPhotoUrl(t?.photo_url ?? null);
    setDocuments(t?.documents ?? []);
  };

  useEffect(() => {
    if (open) reset(initial);
  }, [open, initial?.id]);

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage.from("tenant-docs").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data: { publicUrl } } = supabase.storage.from("tenant-docs").getPublicUrl(data.path);
    return publicUrl;
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/${initial?.id ?? "new"}/photo_${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path);
      setPhotoUrl(url);
      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/${initial?.id ?? "new"}/doc_${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path);
      setDocuments(prev => [...prev, { name: file.name, url }]);
      toast.success("Document uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (idx: number) => setDocuments(prev => prev.filter((_, i) => i !== idx));

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
      photo_url: photoUrl,
      documents,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit tenant" : "Add tenant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <FieldLabel help={HELP.tenantName} required>Name</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <FieldLabel help={HELP.tenantRoom}>Room</FieldLabel>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.tenantPhone}>Phone</FieldLabel>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.tenantMoveIn}>Move-in date (BS)</FieldLabel>
            <Input placeholder="2081-04-15" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.tenantNotes}>Notes</FieldLabel>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          {/* Photo */}
          <div>
            <FieldLabel>Tenant Photo</FieldLabel>
            <div className="flex items-center gap-3 mt-1">
              {photoUrl ? (
                <div className="relative">
                  <img src={photoUrl} alt="Tenant photo" className="h-16 w-16 rounded-full object-cover border" />
                  <button type="button" onClick={() => setPhotoUrl(null)}
                    className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">×</button>
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs border">Photo</div>
              )}
              <label className="cursor-pointer">
                <span className="text-xs text-primary underline">{photoUrl ? "Change photo" : "Upload photo"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Documents */}
          <div>
            <FieldLabel>Documents</FieldLabel>
            <div className="space-y-1 mt-1">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded px-2 py-1 text-xs">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate max-w-[200px]">{doc.name}</a>
                  <button type="button" onClick={() => removeDocument(i)} className="text-destructive ml-2 font-bold">×</button>
                </div>
              ))}
              <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary underline mt-1">
                <span>{uploading ? "Uploading..." : "+ Add document"}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleDocument} disabled={uploading} />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
