import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getDemoStore } from "@/lib/demo-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { approxCurrentBS, bsLabel, bsMonthName } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, type BillStatus } from "@/lib/calc";
import { Plus, TrendingUp, TrendingDown, Minus, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/demo/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard (Demo) — Hamro Rent" }] }),
  component: DemoDashboard,
});

function DemoDashboard() {
  const store = getDemoStore();
  const cur = approxCurrentBS();
  const [filterYear] = useState(cur.year);
  const [filterMonth] = useState(cur.month);

  const tenants = store?.tenants ?? [];
  const bills = store?.bills ?? [];

  const active = tenants.filter((t) => t.is_active);
  const monthBills = bills.filter((b) => b.bs_year === filterYear && b.bs_month === filterMonth);

  const enrichBills = (bs: typeof bills) =>
    bs.map((b) => ({
      bill: b,
      tenant: tenants.find((t) => t.id === b.tenant_id),
      total: computeBillTotal(b, b.additional_charges ?? []),
      paid: computePaid(b.payments ?? []),
      status: computeStatus(b, b.additional_charges ?? [], b.payments ?? []) as BillStatus,
    }));

  const totals = enrichBills(monthBills);
  const allTotals = enrichBills(bills);

  const expected = totals.reduce((s, t) => s + t.total, 0);
  const collected = totals.reduce((s, t) => s + t.paid, 0);
  const outstanding = totals.reduce((s, t) => s + Math.max(0, t.total - t.paid), 0);
  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
  const paidCount = totals.filter((t) => t.status === "paid" || t.status === "overpaid").length;
  const partialCount = totals.filter((t) => t.status === "partial").length;
  const pendingCount = totals.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{bsMonthName(filterMonth)} {filterYear} BS</p>
        </div>
        <Link to="/demo/bills/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Bill</span>
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Expected" value={fmtNPR(expected)} icon={<TrendingUp className="h-4 w-4" />} color="text-primary" />
        <StatCard label="Collected" value={fmtNPR(collected)} icon={<CheckCircle2 className="h-4 w-4" />} color="text-success" />
        <StatCard label="Outstanding" value={fmtNPR(outstanding)} icon={<AlertCircle className="h-4 w-4" />} color="text-warning" />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} icon={<TrendingUp className="h-4 w-4" />} color="text-info" />
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
          <div className="text-2xl font-display font-bold">{paidCount}</div>
          <div className="text-xs text-muted-foreground">Paid</div>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="h-5 w-5 text-warning mx-auto mb-1" />
          <div className="text-2xl font-display font-bold">{partialCount}</div>
          <div className="text-xs text-muted-foreground">Partial</div>
        </Card>
        <Card className="p-4 text-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <div className="text-2xl font-display font-bold">{pendingCount}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </Card>
      </div>

      {/* Bills table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Bills — {bsMonthName(filterMonth)} {filterYear}</h2>
          <span className="text-xs text-muted-foreground">{active.length} active tenants</span>
        </div>
        {totals.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm mb-4">No bills for this month yet.</p>
            <Link to="/demo/bills/new">
              <Button size="sm">Create first bill</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {totals.map(({ bill, tenant, total, paid, status }) => (
              <div key={bill.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-3 hover:bg-accent/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                    {tenant?.name?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate text-sm">{tenant?.name ?? "Unknown"}</div>
                    {tenant?.room_number && (
                      <div className="text-xs text-muted-foreground">Room {tenant.room_number}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium">{fmtNPR(total)}</div>
                    <div className="text-xs text-muted-foreground">
                      {paid > 0 ? `Paid ${fmtNPR(paid)}` : "Unpaid"}
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Active Tenants */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Active Tenants</h2>
          <Link to="/demo/tenants" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {active.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  {t.room_number && <div className="text-xs text-muted-foreground">Room {t.room_number}</div>}
                </div>
              </div>
              <Link
                to="/demo/bills/new"
                className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                + Bill
              </Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-3 sm:p-4">
      <div className={`flex items-center justify-between mb-1.5 ${color}`}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className={`text-xl sm:text-2xl font-display font-bold ${color}`}>{value}</div>
    </Card>
  );
}
