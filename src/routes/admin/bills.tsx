import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBills, adminDeleteBill } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { computeBillTotal, computePaid, computeStatus, fmtNPR } from "@/lib/calc";
import { bsLabel } from "@/lib/bs-calendar";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/bills")({
  head: () => ({ meta: [{ title: "Bills — Admin" }] }),
  component: AdminBills,
});

function AdminBills() {
  const listFn   = useServerFn(adminListBills);
  const deleteFn = useServerFn(adminDeleteBill);
  const qc       = useQueryClient();
  const [search, setSearch] = useState("");
  const [busy, setBusy]     = useState<string | null>(null);
  const [page, setPage]     = useState(1);
  const PAGE = 20;

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["admin-bills"],
    queryFn: () => listFn(),
  });

  const enriched = useMemo(() =>
    (bills as any[]).map((b) => {
      const total  = (() => { try { return computeBillTotal(b, b.additional_charges ?? []); } catch { return 0; } })();
      const paid   = (() => { try { return computePaid(b.payments ?? []); } catch { return 0; } })();
      const status = (() => { try { return computeStatus(b, b.additional_charges ?? [], b.payments ?? []); } catch { return "pending"; } })();
      return { ...b, _total: total, _paid: paid, _status: status };
    }), [bills]);

  const filtered = enriched.filter((b) =>
    !search ||
    (b.tenants?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    bsLabel(b.bs_year, b.bs_month).toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

  const del = async (id: string) => {
    if (!confirm("Delete this bill and all its payments?")) return;
    setBusy(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("Bill deleted");
      qc.invalidateQueries({ queryKey: ["admin-bills"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> All Bills
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(bills as any[]).length} bills across all landlords
          </p>
        </div>
        <input
          type="text"
          placeholder="Search tenant or month…"
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
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Tenant", "Room", "Month", "Total", "Paid", "Status", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slice.map((b: any) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{b.tenants?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.tenants?.room_number ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{bsLabel(b.bs_year, b.bs_month)}</td>
                    <td className="px-4 py-3 font-semibold">{fmtNPR(b._total)}</td>
                    <td className="px-4 py-3 text-green-600">{fmtNPR(b._paid)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b._status} showHelp={false} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link to="/bills/$billId" params={{ billId: b.id }} className="text-xs text-primary hover:underline">View</Link>
                        <Button variant="ghost" size="sm" disabled={busy === b.id} onClick={() => del(b.id)} className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No bills found.</div>
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
