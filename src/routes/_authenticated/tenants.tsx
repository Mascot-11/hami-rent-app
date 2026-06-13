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
import { getMySubscription } from "@/lib/subscription.functions";
import {
  listProperties,
  upsertProperty,
  deleteProperty,
} from "@/lib/properties.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { v, firstError } from "@/lib/validators";
import { getSignedUrls } from "@/lib/storage.functions";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Archive,
  ArchiveRestore,
  Trash2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Sparkles,
  Building2,
  AlertTriangle,
  Loader2,
  Phone,
  Home,
  IndianRupee,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language-context";
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
  const { t } = useLanguage();
  const listFn = useServerFn(listTenants);
  const upsertFn = useServerFn(upsertTenant);
  const setActiveFn = useServerFn(setTenantActive);
  const delFn = useServerFn(deleteTenant);

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => listFn(),
  });

  const subFn = useServerFn(getMySubscription);
  const { data: sub } = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => subFn(),
    staleTime: 60_000,
  });

  const propsFn = useServerFn(listProperties);
  const { data: properties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propsFn(),
    staleTime: 60_000,
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showProps, setShowProps] = useState(false);
  const [showNeedProperty, setShowNeedProperty] = useState(false);
  const [unarchiveTarget, setUnarchiveTarget] = useState<any | null>(null);

  // Pre-emptive client gate: block the form when no slot is free.
  // The server still enforces this (assertSlotAvailable) as the real boundary.
  const slotsFull =
    !!sub && sub.tenant_slots > 0 && sub.tenants_used >= sub.tenant_slots;

  // Over-limit: subscription lapsed and they have more tenants than free tier allows.
  // Existing tenants remain readable; new adds and reactivations are blocked.
  const overLimit = !!sub?.over_limit;
  const overageCount = sub?.overage_count ?? 0;
  const freeSlots = sub?.tenant_slots ?? 3;

  const openNew = () => {
    // A tenant must belong to a property — block creation until one exists.
    if (properties.length === 0) {
      setShowNeedProperty(true);
      return;
    }
    if (slotsFull) {
      setShowUpgrade(true);
      return;
    }
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (t: any) => {
    setEditing(t);
    setShowForm(true);
  };

  // Track which tenant ID is currently being archived/deleted so each row
  // can show its own spinner without every row lighting up at once.
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [pendingDeleteId,  setPendingDeleteId]  = useState<string | null>(null);

  const archive = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) =>
      setActiveFn({ data: v }),
    onMutate: (v) => setPendingArchiveId(v.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Updated");
    },
    onSettled: () => setPendingArchiveId(null),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onMutate: (id) => setPendingDeleteId(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
    onSettled: () => setPendingDeleteId(null),
  });

  const active = tenants.filter((t: any) => t.is_active);
  const archived = tenants.filter((t: any) => !t.is_active);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">{t("tenants.title")}</h1>
        {sub && sub.tenant_slots > 0 && (
          <p className="text-xs text-muted-foreground -mt-1">
            {t("tenants.slotsUsed", { used: sub.tenants_used, limit: sub.tenant_slots })}
            {overLimit && (
              <>
                {" · "}
                <span className="text-amber-600 font-medium">
                  {t("tenants.overLimit", { n: overageCount })}
                </span>
              </>
            )}
            {!overLimit && slotsFull && (
              <>
                {" · "}
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="text-primary underline font-medium"
                >
                  upgrade for more
                </button>
              </>
            )}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={openNew}
            className="w-full sm:w-auto"
            disabled={overLimit}
            title={overLimit ? `Archive ${overageCount} tenant${overageCount !== 1 ? "s" : ""} or renew your plan to add more` : undefined}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t("tenants.addTenant")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowProps(true)}
            className="w-full sm:w-auto"
          >
            <Building2 className="h-4 w-4 mr-1.5" />
            {t("tenants.manageProps")}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {/* ── Over-limit warning — shown when lapsed plan had more tenants than free tier ── */}
      {overLimit && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-300">
              You're over your free-tier limit by {overageCount} tenant{overageCount !== 1 ? "s" : ""}
            </p>
            <p className="text-amber-800 dark:text-amber-400 text-xs leading-relaxed">
              Your subscription has expired. The free plan allows{" "}
              <strong>{freeSlots} active tenants</strong>, but you currently have{" "}
              <strong>{sub?.tenants_used}</strong>. Your existing tenants and all their
              bills are safe — nothing has been deleted. However, you cannot add new
              tenants or reactivate archived ones until you're back within the limit.
            </p>
            <p className="text-amber-800 dark:text-amber-400 text-xs">
              To resolve this:{" "}
              <Link to="/pricing" className="underline font-semibold">renew your plan</Link>
              {" "}to restore your slots, or archive at least{" "}
              <strong>{overageCount}</strong> tenant{overageCount !== 1 ? "s" : ""} below.
            </p>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <TenantList
          title="Active"
          tenants={active}
          overLimit={overLimit}
          freeSlots={freeSlots}
          pendingArchiveId={pendingArchiveId}
          pendingDeleteId={pendingDeleteId}
          onEdit={openEdit}
          onArchive={(id: string) => archive.mutate({ id, is_active: false })}
          onDelete={(id: string) => del.mutate(id)}
        />
      ) : (
        <>
          {properties.map((p: any) => (
            <TenantList
              key={p.id}
              title={p.name}
              tenants={active.filter((t: any) => t.property_id === p.id)}
              overLimit={overLimit}
              freeSlots={freeSlots}
              pendingArchiveId={pendingArchiveId}
              pendingDeleteId={pendingDeleteId}
              onEdit={openEdit}
              onArchive={(id: string) => archive.mutate({ id, is_active: false })}
              onDelete={(id: string) => del.mutate(id)}
            />
          ))}
          <TenantList
            title="Ungrouped"
            tenants={active.filter(
              (t: any) => !t.property_id || !properties.some((p: any) => p.id === t.property_id),
            )}
            overLimit={overLimit}
            freeSlots={freeSlots}
            pendingArchiveId={pendingArchiveId}
            pendingDeleteId={pendingDeleteId}
            onEdit={openEdit}
            onArchive={(id: string) => archive.mutate({ id, is_active: false })}
            onDelete={(id: string) => del.mutate(id)}
          />
        </>
      )}

      {archived.length > 0 && (
        <TenantList
          title="Archived"
          tenants={archived}
          overLimit={overLimit}
          freeSlots={freeSlots}
          pendingArchiveId={pendingArchiveId}
          pendingDeleteId={pendingDeleteId}
          onEdit={openEdit}
          onUnarchive={(tenant: any) => setUnarchiveTarget(tenant)}
          onDelete={(id: string) => del.mutate(id)}
        />
      )}

      <UnarchiveDialog
        tenant={unarchiveTarget}
        overLimit={overLimit}
        overageCount={overageCount}
        reactivating={unarchiveTarget ? pendingArchiveId === unarchiveTarget.id : false}
        onClose={() => setUnarchiveTarget(null)}
        onConfirm={() => {
          if (!unarchiveTarget) return;
          archive.mutate(
            { id: unarchiveTarget.id, is_active: true },
            { onSuccess: () => setUnarchiveTarget(null) }
          );
        }}
      />

      <TenantFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        initial={editing}
        properties={properties}
        onSave={async (v: any) => {
          try {
            await upsertFn({ data: v });
            qc.invalidateQueries({ queryKey: ["tenants"] });
            qc.invalidateQueries({ queryKey: ["my-subscription"] });
            setShowForm(false);
            toast.success("Saved");
          } catch (e: any) {
            // Server is the real boundary — if slots filled meanwhile, upsell.
            if (/slot/i.test(e?.message ?? "")) {
              setShowForm(false);
              setShowUpgrade(true);
            } else {
              toast.error(e?.message ?? "Could not save tenant");
            }
          }
        }}
      />

      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        used={sub?.tenants_used ?? 0}
        limit={sub?.tenant_slots ?? 0}
        plan={sub?.plan ?? "free"}
      />

      <PropertyManagerDialog
        open={showProps}
        onOpenChange={setShowProps}
        properties={properties}
      />

      <NeedPropertyDialog
        open={showNeedProperty}
        onOpenChange={setShowNeedProperty}
        onAddProperty={() => {
          setShowNeedProperty(false);
          setShowProps(true);
        }}
      />
    </div>
  );
}

// ─── Need-Property Dialog ─────────────────────────────────────────────────────
// Shown when the landlord tries to add a tenant before any property exists.
// A tenant must be grouped under a property, so we redirect them to create one.

function NeedPropertyDialog({
  open,
  onOpenChange,
  onAddProperty,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddProperty: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Add a property first
          </DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-muted-foreground">
          Every tenant belongs to a property. Create at least one property
          (your building) before adding tenants.
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={onAddProperty}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add property
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Property Manager Dialog ──────────────────────────────────────────────────
// Create / rename / delete properties. Deleting a property does NOT delete its
// tenants — they fall back to "Ungrouped" (FK is ON DELETE SET NULL).

function PropertyManagerDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  properties: any[];
}) {
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertProperty);
  const deleteFn = useServerFn(deleteProperty);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["properties"] });
    qc.invalidateQueries({ queryKey: ["tenants"] });
  };

  const add = useMutation({
    mutationFn: () => upsertFn({ data: { name: name.trim(), address: address.trim() || null } }),
    onSuccess: () => {
      setName("");
      setAddress("");
      invalidate();
      toast.success("Property added");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add property"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Property deleted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete property"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Properties</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Group tenants by building. Tenants keep their property when you edit them.
            Deleting a property keeps its tenants — they just become ungrouped.
          </p>

          {/* Existing properties */}
          <div className="space-y-2">
            {properties.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No properties yet.</p>
            )}
            {properties.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.address && (
                    <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  disabled={remove.isPending}
                  onClick={() => {
                    if (confirm(`Delete property "${p.name}"? Its tenants become ungrouped.`))
                      remove.mutate(p.id);
                  }}
                >
                  {remove.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="border-t pt-4 space-y-2">
            <FieldLabel required>Property name</FieldLabel>
            <Input
              value={name}
              placeholder="e.g. Baluwatar Building"
              onChange={(e) => setName(e.target.value)}
            />
            <FieldLabel>Address (optional)</FieldLabel>
            <Input
              value={address}
              placeholder="e.g. Ward 4, Baluwatar"
              onChange={(e) => setAddress(e.target.value)}
            />
            <Button
              className="w-full mt-1"
              disabled={!name.trim() || add.isPending}
              onClick={() => add.mutate()}
            >
              {add.isPending
                ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                : <Plus className="h-4 w-4 mr-1.5" />}
              {add.isPending ? "Adding…" : "Add property"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upgrade Dialog ───────────────────────────────────────────────────────────
// Shown when a landlord hits their active-tenant slot limit.

function UpgradeDialog({
  open,
  onOpenChange,
  used,
  limit,
  plan,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  used: number;
  limit: number;
  plan: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            You've reached your tenant limit
          </DialogTitle>
        </DialogHeader>

        <div className="text-center text-sm text-muted-foreground space-y-3">
          <p>
            Your <span className="font-medium capitalize">{plan}</span> plan covers{" "}
            <span className="font-medium text-foreground">{limit}</span> active tenants
            {limit > 0 && (
              <>
                {" "}
                and you're using all{" "}
                <span className="font-medium text-foreground">{used}</span>
              </>
            )}
            . Upgrade to add more, or archive a tenant to free up a slot.
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
            Basic gives you 10 slots at रू 150/mo · Pro gives you 30 at रू 300/mo.
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link to="/pricing">View plans &amp; upgrade</Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Unarchive Dialog ─────────────────────────────────────────────────────────

function UnarchiveDialog({
  tenant,
  overLimit,
  overageCount,
  reactivating,
  onClose,
  onConfirm,
}: {
  tenant: any | null;
  overLimit: boolean;
  overageCount: number;
  reactivating: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={!!tenant} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ArchiveRestore className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Unarchive {tenant?.name}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          {overLimit ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-3 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <p className="font-semibold">Cannot unarchive right now</p>
              <p>
                Your subscription has expired and you're already{" "}
                <strong>{overageCount} tenant{overageCount !== 1 ? "s" : ""}</strong> over
                the free-tier limit. Unarchiving would add another.
              </p>
              <p>
                To unarchive, first{" "}
                <Link to="/pricing" className="underline font-semibold" onClick={onClose}>
                  renew your plan
                </Link>
                {" "}or archive an existing active tenant to free up a slot.
              </p>
            </div>
          ) : (
            <>
              <p className="text-center">
                <strong className="text-foreground">{tenant?.name}</strong> will be
                moved back to your active tenant list.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs space-y-1">
                {tenant?.room_number && (
                  <p>Room: <span className="font-medium text-foreground">{tenant.room_number}</span></p>
                )}
                {tenant?.phone && (
                  <p>Phone: <span className="font-medium text-foreground">{tenant.phone}</span></p>
                )}
                {tenant?.base_rent != null && (
                  <p>Base rent: <span className="font-medium text-foreground">{fmtNPR(tenant.base_rent)}</span></p>
                )}
                {tenant?.move_in_date_bs && (
                  <p>Moved in: <span className="font-medium text-foreground">{tenant.move_in_date_bs}</span></p>
                )}
                <p className="text-muted-foreground pt-1">
                  All existing bills and payment history will remain intact.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!overLimit && (
            <Button
              className="w-full gap-1.5"
              disabled={reactivating}
              onClick={onConfirm}
            >
              {reactivating
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ArchiveRestore className="h-4 w-4" />}
              {reactivating ? "Unarchiving…" : "Yes, unarchive"}
            </Button>
          )}
          <Button
            variant={overLimit ? "default" : "ghost"}
            className="w-full"
            disabled={reactivating}
            onClick={onClose}
          >
            {overLimit ? "Got it" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tenant List ──────────────────────────────────────────────────────────────

function TenantList({
  title,
  tenants,
  overLimit,
  freeSlots,
  pendingArchiveId,
  pendingDeleteId,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: any) {
  const { t } = useLanguage();
  if (tenants.length === 0) return null;
  const isArchived = title === "Archived";
  return (
    <Card className="overflow-hidden">
      {/* Table header */}
      <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {isArchived ? (
            <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/40" />
          ) : (
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
          )}
          {title}
          <span className="text-xs font-normal text-muted-foreground">({tenants.length})</span>
        </h2>
      </div>

      {/* Column headers — hidden on mobile */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-x-4 px-4 py-2 bg-muted/30 border-b text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span>{t("tenants.colName")}</span>
        <span>{t("tenants.colRoom")}</span>
        <span>{t("tenants.colPhone")}</span>
        <span>{t("tenants.colRent")}</span>
        <span className="text-right pr-1">{t("tenants.colActions")}</span>
      </div>

      <div className="divide-y">
        {tenants.map((t: any, idx: number) => (
          <TenantRow
            key={t.id}
            tenant={t}
            isExcess={overLimit && !isArchived && idx >= freeSlots}
            archiving={pendingArchiveId === t.id}
            deleting={pendingDeleteId === t.id}
            isArchived={isArchived}
            onEdit={onEdit}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
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
  isExcess,
  archiving,
  deleting,
  isArchived,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
}: any) {
  const [expanded, setExpanded] = useState(false);
  const busy = archiving || deleting;

  return (
    <div className={isExcess ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
      {/* Over-limit strip */}
      {isExcess && (
        <div className="flex items-center gap-2 px-4 py-1 bg-amber-100/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          Over free-tier limit — archive this tenant to come back within quota
        </div>
      )}

      {/* Mobile layout */}
      <div className="sm:hidden flex items-start justify-between gap-3 px-4 py-3">
        <Link to="/tenants/$tenantId" params={{ tenantId: t.id }} className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-sm truncate">{t.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {t.room_number && <span className="flex items-center gap-1"><Home className="h-3 w-3" />{t.room_number}</span>}
            {t.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span>}
            {t.base_rent != null && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{fmtNPR(t.base_rent)}</span>}
            {t.move_in_date_bs && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{t.move_in_date_bs}</span>}
          </div>
        </Link>
        <TenantActions
          tenant={t}
          busy={busy}
          archiving={archiving}
          deleting={deleting}
          isArchived={isArchived}
          expanded={expanded}
          onToggleExpand={() => setExpanded(v => !v)}
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
        />
      </div>

      {/* Desktop table row */}
      <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-x-4 px-4 py-3 items-center">
        <Link to="/tenants/$tenantId" params={{ tenantId: t.id }} className="min-w-0">
          <p className="font-medium text-sm truncate">{t.name}</p>
          {t.move_in_date_bs && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <CalendarDays className="h-3 w-3" /> {t.move_in_date_bs}
            </p>
          )}
        </Link>
        <span className="text-sm text-muted-foreground truncate">
          {t.room_number
            ? <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5 flex-shrink-0" />{t.room_number}</span>
            : <span className="text-muted-foreground/40">—</span>}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          {t.phone
            ? <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 flex-shrink-0" />{t.phone}</span>
            : <span className="text-muted-foreground/40">—</span>}
        </span>
        <span className="text-sm font-medium">
          {t.base_rent != null
            ? fmtNPR(t.base_rent)
            : <span className="text-muted-foreground/40 font-normal">—</span>}
        </span>
        <TenantActions
          tenant={t}
          busy={busy}
          archiving={archiving}
          deleting={deleting}
          isArchived={isArchived}
          expanded={expanded}
          onToggleExpand={() => setExpanded(v => !v)}
          onEdit={onEdit}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
        />
      </div>

      {/* Expandable bill history */}
      {expanded && <TenantBillHistory tenantId={t.id} tenantName={t.name} />}
    </div>
  );
}

// ─── Tenant Actions (dropdown + bills toggle) ─────────────────────────────────

function TenantActions({ tenant: ten, busy, archiving, deleting, isArchived, expanded, onToggleExpand, onEdit, onArchive, onUnarchive, onDelete }: any) {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {/* Bills toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs gap-1 px-2"
        disabled={busy}
        onClick={onToggleExpand}
        title={expanded ? "Hide bills" : "View bills"}
      >
        <Receipt className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("tenants.bills")}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {/* Actions dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={busy}
          >
            {(archiving || deleting)
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onEdit(ten)}>
            {t("tenants.editMenu")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {!isArchived && onArchive && (
            <DropdownMenuItem
              onClick={() => onArchive(ten.id)}
              className="text-muted-foreground"
            >
              <Archive className="h-3.5 w-3.5 mr-2" />
              {t("action.archive")}
            </DropdownMenuItem>
          )}
          {isArchived && onUnarchive && (
            <DropdownMenuItem onClick={() => onUnarchive(ten)}>
              <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
              {t("action.unarchive")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => {
              if (confirm(`Delete ${ten.name}? This removes all bills and payments.`))
                onDelete(ten.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            {t("action.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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

function TenantFormDialog({ open, onOpenChange, initial, onSave, properties = [] }: any) {
  const [name, setName] = useState(initial?.name ?? "");
  const [room, setRoom] = useState(initial?.room_number ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [propertyId, setPropertyId] = useState(initial?.property_id ?? "");
  const [moveIn, setMoveIn] = useState(initial?.move_in_date_bs ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [baseRent, setBaseRent] = useState(initial?.base_rent != null ? String(initial.base_rent) : "");
  const [defaultWater, setDefaultWater] = useState(initial?.default_water_bill != null ? String(initial.default_water_bill) : "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null);
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>(initial?.documents ?? []);
  const [uploading, setUploading] = useState(false);

  const reset = (t: any) => {
    setName(t?.name ?? "");
    setRoom(t?.room_number ?? "");
    setPhone(t?.phone ?? "");
    setPropertyId(t?.property_id ?? "");
    setMoveIn(t?.move_in_date_bs ?? "");
    setNotes(t?.notes ?? "");
    setBaseRent(t?.base_rent != null ? String(t.base_rent) : "");
    setDefaultWater(t?.default_water_bill != null ? String(t.default_water_bill) : "");
    setPhotoUrl(t?.photo_url ?? null);
    setDocuments(t?.documents ?? []);
  };

  useEffect(() => {
    if (open) reset(initial);
  }, [open, initial?.id]);

  // Allowlist + size cap — uploads are an injection/abuse vector.
  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = new Set([
    "image/jpeg", "image/png", "image/webp", "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);
  const validateFile = (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 5 MB)");
    if (!ALLOWED_TYPES.has(file.type)) throw new Error("Unsupported file type");
  };
  // Private bucket: return the storage PATH; signed URLs are minted on view.
  const uploadFile = async (file: File, path: string) => {
    validateFile(file);
    const { data, error } = await supabase.storage.from("tenant-docs").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    return data.path;
  };
  // Sanitize filename to avoid path traversal / odd characters in object keys.
  const safeName = (name: string) =>
    name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/${initial?.id ?? "new"}/photo_${Date.now()}_${safeName(file.name)}`;
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
      const path = `${user!.id}/${initial?.id ?? "new"}/doc_${Date.now()}_${safeName(file.name)}`;
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
    if (!propertyId) return toast.error("Please select a property");
    const err = firstError(
      v.name(name),
      v.maxLen(room, "Room number", 40),
      v.phone(phone),
      v.bsDate(moveIn),
      v.maxLen(notes, "Notes", 2000),
      baseRent !== "" ? v.amount(baseRent, "Base rent", { allowZero: true }) : null,
      defaultWater !== "" ? v.amount(defaultWater, "Default water bill", { allowZero: true, max: 1_000_000 }) : null,
    );
    if (err) return toast.error(err);
    onSave({
      id: initial?.id,
      name: name.trim(),
      room_number: room.trim() || null,
      phone: phone.trim() || null,
      property_id: propertyId || null,
      move_in_date_bs: moveIn.trim() || null,
      notes: notes.trim() || null,
      photo_url: photoUrl,
      documents,
      base_rent: baseRent !== "" ? Number(baseRent) : null,
      default_water_bill: defaultWater !== "" ? Number(defaultWater) : null,
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
            <FieldLabel
              help="Group this tenant under one of your buildings. Manage the list from the Properties button."
              required
            >
              Property
            </FieldLabel>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              className="w-full text-sm border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring h-9"
            >
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel help={HELP.tenantPhone}>Phone</FieldLabel>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.tenantMoveIn}>Move-in date (BS)</FieldLabel>
            <Input placeholder="2081-04-15" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />
          </div>

          {/* Base rent & default water */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel help="Default rent amount pre-filled on every new bill for this tenant.">
                Base rent (NPR)
              </FieldLabel>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 8000"
                value={baseRent}
                onChange={(e) => setBaseRent(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel help="Default water charge pre-filled on every new bill for this tenant.">
                Default water (NPR)
              </FieldLabel>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={defaultWater}
                onChange={(e) => setDefaultWater(e.target.value)}
              />
            </div>
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
                  <SignedImg path={photoUrl} alt="Tenant photo" className="h-16 w-16 rounded-full object-cover border" />
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
                  <SignedLink path={doc.url} name={doc.name} />
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
            <Button type="submit" disabled={uploading} className="gap-1.5">
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              {uploading ? "Uploading…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Signed-URL resolvers for the private tenant-docs bucket ──────────────────
// Accepts either a storage path (new) or a full URL (legacy public-bucket data).
function useSignedUrl(pathOrUrl: string | null | undefined) {
  const signFn = useServerFn(getSignedUrls);
  const isUrl = !!pathOrUrl && /^https?:\/\//.test(pathOrUrl);
  const { data } = useQuery({
    queryKey: ["signed-url", pathOrUrl],
    queryFn: async () => {
      if (!pathOrUrl) return null;
      const res = await signFn({ data: { paths: [pathOrUrl] } });
      return res[pathOrUrl] ?? null;
    },
    enabled: !!pathOrUrl && !isUrl,
    staleTime: 8 * 60 * 1000,
    retry: false,
  });
  return isUrl ? pathOrUrl! : data ?? null;
}

function SignedImg({ path, alt, className }: { path: string | null; alt: string; className?: string }) {
  const url = useSignedUrl(path);
  if (!url) return <div className={className} style={{ background: "var(--muted)" }} />;
  return <img src={url} alt={alt} className={className} />;
}

function SignedLink({ path, name }: { path: string; name: string }) {
  const url = useSignedUrl(path);
  return (
    <a
      href={url ?? undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline truncate max-w-[200px]"
      onClick={(e) => { if (!url) e.preventDefault(); }}
    >
      {name}
    </a>
  );
}
