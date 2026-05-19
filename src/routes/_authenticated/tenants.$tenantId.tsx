import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTenant } from "@/lib/tenants.functions";
import { listBills } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { bsLabel, compareBSMonth } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, type BillStatus } from "@/lib/calc";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenants/$tenantId")({
  head: () => ({ meta: [{ title: "Tenant — Rent Manager" }] }),
  component: TenantPage,
});

function TenantPage() {
  const { tenantId } = Route.useParams();
  const tFn = useServerFn(getTenant);
  const bFn = useServerFn(listBills);
  const { data: tenant } = useQuery({ queryKey: ["tenant", tenantId], queryFn: () => tFn({ data: { id: tenantId } }) });
  const { data: bills = [] } = useQuery({ queryKey: ["bills", tenantId], queryFn: () => bFn({ data: { tenant_id: tenantId } }) });

  if (!tenant) return <p className="text-muted-foreground">Loading…</p>;

  const sorted = [...bills].sort((a: any, b: any) => -compareBSMonth(a, b));
  const lifetime = sorted.reduce((acc, b: any) => {
    const total = computeBillTotal(b, b.additional_charges ?? []);
    const paid = computePaid(b.payments ?? []);
    acc.total += total; acc.paid += paid;
    return acc;
  }, { total: 0, paid: 0 });

  return (
    <div className="space-y-6">
      <div>
        <Link to="/tenants" className="text-sm text-primary underline">← Tenants</Link>
        <h1 className="text-3xl font-display mt-1">{tenant.name}</h1>
        <p className="text-muted-foreground text-sm">
          Room {tenant.room_number ?? "—"} {tenant.phone ? `· ${tenant.phone}` : ""} {tenant.move_in_date_bs ? `· Moved in ${tenant.move_in_date_bs}` : ""}
        </p>
        {tenant.notes && <p className="text-sm mt-2 italic text-muted-foreground">{tenant.notes}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Lifetime billed</div><div className="text-xl font-display">{fmtNPR(lifetime.total)}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Lifetime paid</div><div className="text-xl font-display">{fmtNPR(lifetime.paid)}</div></Card>
        <Card className="p-4"><div className="text-xs uppercase text-muted-foreground">Outstanding</div><div className="text-xl font-display">{fmtNPR(lifetime.total - lifetime.paid)}</div></Card>
      </div>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Bills ({sorted.length})</h2>
          <Link to="/bills/new"><Button size="sm"><Plus className="h-4 w-4 mr-1" />New</Button></Link>
        </div>
        {sorted.length === 0 ? <p className="text-sm text-muted-foreground">No bills yet.</p> : (
          <div className="space-y-2">
            {sorted.map((b: any) => {
              const total = computeBillTotal(b, b.additional_charges ?? []);
              const paid = computePaid(b.payments ?? []);
              const status = computeStatus(b, b.additional_charges ?? [], b.payments ?? []) as BillStatus;
              return (
                <Link key={b.id} to="/bills/$billId" params={{ billId: b.id }}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors">
                  <div>
                    <div className="font-medium">{bsLabel(b.bs_year, b.bs_month)}</div>
                    <div className="text-sm text-muted-foreground">{fmtNPR(paid)} of {fmtNPR(total)}</div>
                  </div>
                  <StatusBadge status={status} />
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
