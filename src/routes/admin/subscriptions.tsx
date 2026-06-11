import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListSubscriptions,
  adminSetSubscription,
  adminRecordSubscriptionPayment,
  adminListSubscriptionPayments,
} from "@/lib/admin.functions";
import { v, firstError } from "@/lib/validators";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, Pencil, BadgeDollarSign, Crown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions — Admin" }] }),
  component: AdminSubscriptions,
});

const PLANS = ["free", "basic", "pro", "custom"] as const;
const STATUSES = ["active", "suspended", "expired"] as const;
const METHODS = ["manual", "cash", "bank_transfer", "esewa", "khalti", "other"] as const;

const planBadge: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-primary/15 text-primary",
  pro: "bg-success/15 text-success",
  custom: "bg-warning/15 text-warning",
};

function AdminSubscriptions() {
  const listFn = useServerFn(adminListSubscriptions);
  const setFn = useServerFn(adminSetSubscription);
  const payFn = useServerFn(adminRecordSubscriptionPayment);
  const payListFn = useServerFn(adminListSubscriptionPayments);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [paying, setPaying] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-subscriptions"],
    queryFn: () => listFn(),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["admin-sub-payments"],
    queryFn: () => payListFn(),
  });

  const emailById = new Map(rows.map((r: any) => [r.user_id, r.email]));
  const filtered = rows.filter((r: any) =>
    !search || r.email.toLowerCase().includes(search.toLowerCase()),
  );

  const saveSub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const slotsErr = v.intRange(String(f.get("tenant_slots")), "Tenant slots", 0, 10000);
    const notesErr = v.maxLen(String(f.get("notes") || ""), "Notes", 1000);
    const vErr = firstError(slotsErr, notesErr);
    if (vErr) return toast.error(vErr);
    setBusy(true);
    try {
      const expRaw = String(f.get("expires_at") || "");
      await setFn({
        data: {
          user_id: editing.user_id,
          plan: String(f.get("plan")) as any,
          status: String(f.get("status")) as any,
          tenant_slots: Number(f.get("tenant_slots")),
          expires_at: expRaw ? new Date(expRaw).toISOString() : null,
          notes: String(f.get("notes") || "") || null,
        },
      });
      toast.success("Subscription updated");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const savePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const pf = String(f.get("period_from") || "");
    const pt = String(f.get("period_to") || "");
    const vErr = firstError(
      v.amount(String(f.get("amount_npr")), "Amount", { max: 100_000_000 }),
      v.dateOrder(pf, pt),
      v.maxLen(String(f.get("reference") || ""), "Reference", 200),
      v.maxLen(String(f.get("note") || ""), "Note", 1000),
    );
    if (vErr) return toast.error(vErr);
    setBusy(true);
    try {
      await payFn({
        data: {
          user_id: paying.user_id,
          amount_npr: Number(f.get("amount_npr")),
          method: String(f.get("method")) as any,
          reference: String(f.get("reference") || "") || null,
          note: String(f.get("note") || "") || null,
          period_from: String(f.get("period_from") || "") || null,
          period_to: String(f.get("period_to") || "") || null,
        },
      });
      toast.success("Payment recorded");
      setPaying(null);
      qc.invalidateQueries({ queryKey: ["admin-sub-payments"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Crown className="h-6 w-6" /> Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Allocate tenant slots & record manual payments
          </p>
        </div>
        <input
          type="text" placeholder="Search by email…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
        />
      </div>

      <Card className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Landlord", "Plan", "Status", "Slots used", "Expires", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r: any) => (
                <tr key={r.user_id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium truncate max-w-[220px]">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 capitalize ${planBadge[r.plan]}`}>{r.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs capitalize ${r.status === "active" && !r.expired ? "text-success" : "text-destructive"}`}>
                      {r.expired ? "lapsed" : r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className={r.tenants_used >= r.tenant_slots ? "text-warning font-semibold" : ""}>
                      {r.tenants_used} / {r.tenant_slots}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {r.expires_at ? new Date(r.expires_at).toLocaleDateString("en-NP") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                        onClick={() => setEditing(r)}>
                        <Pencil className="h-3.5 w-3.5" /> Plan
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => setPaying(r)}>
                        <BadgeDollarSign className="h-3.5 w-3.5" /> Payment
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Recent manual payments ─────────────────────────────────────── */}
      <Card className="overflow-x-auto">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent subscription payments</h2>
        </div>
        {payments.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
        ) : (
          <table className="w-full text-sm min-w-[560px]">
            <tbody className="divide-y divide-border">
              {payments.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 truncate max-w-[200px]">{emailById.get(p.user_id) ?? p.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-2.5 font-semibold tabular-nums">रू {Number(p.amount_npr).toLocaleString("en-NP")}</td>
                  <td className="px-4 py-2.5 text-xs capitalize text-muted-foreground">{p.method.replace("_", " ")}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.reference || "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString("en-NP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Edit plan dialog ───────────────────────────────────────────── */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Subscription — {editing?.email}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={saveSub} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Plan</span>
                  <select name="plan" defaultValue={editing.plan} className="w-full border rounded-lg px-3 py-2 bg-background text-sm capitalize">
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <select name="status" defaultValue={editing.status} className="w-full border rounded-lg px-3 py-2 bg-background text-sm capitalize">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Tenant slots</span>
                  <input name="tenant_slots" type="number" min={0} max={10000} required
                    defaultValue={editing.raw_slots}
                    className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
                </label>
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Expires (optional)</span>
                  <input name="expires_at" type="date"
                    defaultValue={editing.expires_at ? editing.expires_at.slice(0, 10) : ""}
                    className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
                </label>
              </div>
              <label className="text-sm space-y-1 block">
                <span className="text-xs font-medium text-muted-foreground">Notes</span>
                <textarea name="notes" rows={2} maxLength={1000} defaultValue={editing.notes ?? ""}
                  className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
              </label>
              <p className="text-xs text-muted-foreground">
                Currently using <b>{editing.tenants_used}</b> active tenant slot{editing.tenants_used !== 1 && "s"}. Lapsed/expired plans fall back to 3 free slots; suspended = 0.
              </p>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Record payment dialog ──────────────────────────────────────── */}
      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record payment — {paying?.email}</DialogTitle></DialogHeader>
          {paying && (
            <form onSubmit={savePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Amount (NPR)</span>
                  <input name="amount_npr" type="number" min={0} step="0.01" required
                    className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
                </label>
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Method</span>
                  <select name="method" defaultValue="manual" className="w-full border rounded-lg px-3 py-2 bg-background text-sm capitalize">
                    {METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                  </select>
                </label>
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Period from</span>
                  <input name="period_from" type="date" className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
                </label>
                <label className="text-sm space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Period to</span>
                  <input name="period_to" type="date" className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
                </label>
              </div>
              <label className="text-sm space-y-1 block">
                <span className="text-xs font-medium text-muted-foreground">Reference (receipt no., txn ID…)</span>
                <input name="reference" maxLength={200} className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
              </label>
              <label className="text-sm space-y-1 block">
                <span className="text-xs font-medium text-muted-foreground">Note</span>
                <textarea name="note" rows={2} maxLength={1000} className="w-full border rounded-lg px-3 py-2 bg-background text-sm" />
              </label>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setPaying(null)}>Cancel</Button>
                <Button type="submit" disabled={busy}>{busy ? "Recording…" : "Record payment"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
