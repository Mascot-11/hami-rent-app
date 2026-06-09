import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPayments, adminDeletePayment } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fmtNPR } from "@/lib/calc";
import { bsLabel } from "@/lib/bs-calendar";
import { CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Admin" }] }),
  component: AdminPayments,
});

function AdminPayments() {
  const listFn   = useServerFn(adminListPayments);
  const deleteFn = useServerFn(adminDeletePayment);
  const qc       = useQueryClient();
  const [search, setSearch] = useState("");
  const [busy, setBusy]     = useState<string | null>(null);
  const [page, setPage]     = useState(1);
  const PAGE = 20;

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => listFn(),
  });

  const filtered = (payments as any[]).filter((p) =>
    !search ||
    (p.bills?.tenants?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.payment_method ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  const del = async (id: string) => {
    if (!confirm("Delete this payment record?")) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("Payment deleted");
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" /> All Payments
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(payments as any[]).length} payment records (latest 500)
          </p>
        </div>
        <input
          type="text"
          placeholder="Search tenant or method…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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
                  {["Tenant", "Bill Month", "Amount", "Method", "Date (BS)", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slice.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.bills?.tenants?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.bills ? bsLabel(p.bills.bs_year, p.bills.bs_month) : "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">{fmtNPR(Number(p.amount_paid ?? 0))}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{p.payment_method ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.payment_date_bs ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" disabled={busy === p.id} onClick={() => del(p.id)} className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No payments found.</div>
            )}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-accent">← Prev</button>
            <span>{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-accent">Next →</button>
          </div>
        )}
      </Card>
    </div>
  );
}
