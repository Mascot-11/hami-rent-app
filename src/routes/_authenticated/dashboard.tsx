import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/HelpTip";
import { StatusBadge } from "@/components/StatusBadge";
import { HELP } from "@/lib/help-copy";
import { approxCurrentBS, bsLabel } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, type BillStatus } from "@/lib/calc";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Rent Manager" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const cur = approxCurrentBS();

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const tenants = data?.tenants ?? [];
  const bills = data?.bills ?? [];

  const active = tenants.filter((t: any) => t.is_active);
  const monthBills = bills.filter((b: any) => b.bs_year === cur.year && b.bs_month === cur.month);
  const totals = monthBills.map((b: any) => ({
    bill: b,
    total: computeBillTotal(b, b.additional_charges ?? []),
    paid: computePaid(b.payments ?? []),
    status: computeStatus(b, b.additional_charges ?? [], b.payments ?? []) as BillStatus,
  }));
  const expected = totals.reduce((s, t) => s + t.total, 0);
  const collected = totals.reduce((s, t) => s + t.paid, 0);
  const paidCount = totals.filter((t) => t.status === "paid" || t.status === "overpaid").length;
  const pendingCount = totals.filter((t) => t.status === "pending" || t.status === "partial").length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Current month: {bsLabel(cur.year, cur.month)}</p>
        </div>
        <Link to="/bills/new"><Button><Plus className="h-4 w-4 mr-1.5" />New bill</Button></Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Active tenants" value={String(active.length)} help={HELP.dashActiveTenants} />
        <Stat label="Paid this month" value={String(paidCount)} help={HELP.dashPaidThisMonth} />
        <Stat label="Pending" value={String(pendingCount)} help={HELP.dashPendingThisMonth} />
        <Stat label="Collected" value={fmtNPR(collected)} help={HELP.dashCollected} />
        <Stat label="Expected" value={fmtNPR(expected)} help={HELP.dashExpected} />
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold mb-3">This month's bills</h2>
        {monthBills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bills yet for {bsLabel(cur.year, cur.month)}. <Link to="/bills/new" className="text-primary underline">Create one</Link>.</p>
        ) : (
          <div className="space-y-2">
            {totals.map((t) => (
              <Link key={t.bill.id} to="/bills/$billId" params={{ billId: t.bill.id }}
                className="flex items-center justify-between gap-3 p-3 rounded-md border hover:bg-accent transition-colors">
                <div>
                  <div className="font-medium">{t.bill.tenants?.name ?? "—"} <span className="text-muted-foreground text-sm">· Room {t.bill.tenants?.room_number ?? "—"}</span></div>
                  <div className="text-sm text-muted-foreground">{fmtNPR(t.paid)} paid of {fmtNPR(t.total)}</div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
        {label}<HelpTip text={help} label={label} />
      </div>
      <div className="text-2xl font-display mt-1">{value}</div>
    </Card>
  );
}
