import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/HelpTip";
import { StatusBadge } from "@/components/StatusBadge";
import { HELP } from "@/lib/help-copy";
import { approxCurrentBS, bsLabel, bsMonthName, nextBSMonth, compareBSMonth } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, type BillStatus } from "@/lib/calc";
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState, useMemo } from "react";
import { BSMonthPicker } from "@/components/BSMonthPicker";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Rent Manager" }] }),
  component: Dashboard,
});

type StatusFilter = "all" | "paid" | "partial" | "pending" | "overpaid";

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const cur = approxCurrentBS();

  // Filters
  const [filterYear, setFilterYear] = useState(cur.year);
  const [filterMonth, setFilterMonth] = useState(cur.month);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterRoom, setFilterRoom] = useState("");

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const tenants = data?.tenants ?? [];
  const bills = data?.bills ?? [];
  const active = tenants.filter((t: any) => t.is_active);

  // Current selected month bills
  const monthBills = bills.filter((b: any) =>
    b.bs_year === filterYear && b.bs_month === filterMonth
  );

  // Previous month for comparison
  const prevMonth = filterMonth === 1
    ? { year: filterYear - 1, month: 12 }
    : { year: filterYear, month: filterMonth - 1 };
  const prevMonthBills = bills.filter((b: any) =>
    b.bs_year === prevMonth.year && b.bs_month === prevMonth.month
  );

  const enrichBills = (bs: any[]) => bs.map((b) => ({
    bill: b,
    total: computeBillTotal(b, b.additional_charges ?? []),
    paid: computePaid(b.payments ?? []),
    status: computeStatus(b, b.additional_charges ?? [], b.payments ?? []) as BillStatus,
  }));

  const totals = enrichBills(monthBills);
  const prevTotals = enrichBills(prevMonthBills);

  // Stats for selected month
  const expected = totals.reduce((s, t) => s + t.total, 0);
  const collected = totals.reduce((s, t) => s + t.paid, 0);
  const outstanding = totals.reduce((s, t) => s + Math.max(0, t.total - t.paid), 0);
  const paidCount = totals.filter((t) => t.status === "paid" || t.status === "overpaid").length;
  const pendingCount = totals.filter((t) => t.status === "pending" || t.status === "partial").length;

  // Stats for previous month
  const prevCollected = prevTotals.reduce((s, t) => s + t.paid, 0);
  const collectedDiff = prevCollected > 0 ? ((collected - prevCollected) / prevCollected) * 100 : null;

  // Filtered bills list
  const filtered = totals.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterTenant && !t.bill.tenants?.name?.toLowerCase().includes(filterTenant.toLowerCase())) return false;
    if (filterRoom && !String(t.bill.tenants?.room_number ?? "").toLowerCase().includes(filterRoom.toLowerCase())) return false;
    return true;
  });

  const isCurrentMonth = filterYear === cur.year && filterMonth === cur.month;
  const rentForMonth = nextBSMonth(filterYear, filterMonth);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">Dashboard</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {isCurrentMonth ? "Current month: " : "Viewing: "}{bsLabel(filterYear, filterMonth)}
            {" · "}Rent advance for {bsMonthName(rentForMonth.month)} {rentForMonth.year}
          </p>
        </div>
        <Link to="/bills/new" className="self-start">
          <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1.5" />New bill</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Stat label="Active tenants" value={String(active.length)} help={HELP.dashActiveTenants} />
        <Stat label="Paid this month" value={String(paidCount)} help={HELP.dashPaidThisMonth} />
        <Stat label="Pending" value={String(pendingCount)} help={HELP.dashPendingThisMonth} />
        <Stat label="Collected" value={fmtNPR(collected)} help={HELP.dashCollected} />
        <Stat label="Expected" value={fmtNPR(expected)} help={HELP.dashExpected} />
      </div>

      {/* Month-over-month comparison */}
      <Card className="p-3 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold mb-3 flex items-center gap-2">
          Month-over-month
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Previous month */}
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground mb-1">{bsLabel(prevMonth.year, prevMonth.month)}</p>
            <p className="text-lg font-display">{fmtNPR(prevCollected)}</p>
            <p className="text-xs text-muted-foreground">collected</p>
          </div>

          {/* Current/selected month */}
          <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground mb-1">{bsLabel(filterYear, filterMonth)}</p>
            <p className="text-lg font-display">{fmtNPR(collected)}</p>
            <p className="text-xs text-muted-foreground">collected · {fmtNPR(outstanding)} outstanding</p>
          </div>

          {/* Trend */}
          <div className="rounded-md bg-muted/40 p-3 flex flex-col justify-center">
            {collectedDiff === null ? (
              <p className="text-xs text-muted-foreground">No data for previous month</p>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  {collectedDiff > 0
                    ? <TrendingUp className="h-5 w-5 text-green-500" />
                    : collectedDiff < 0
                    ? <TrendingDown className="h-5 w-5 text-red-500" />
                    : <Minus className="h-5 w-5 text-muted-foreground" />}
                  <span className={`text-lg font-display ${collectedDiff > 0 ? "text-green-600" : collectedDiff < 0 ? "text-red-500" : ""}`}>
                    {collectedDiff > 0 ? "+" : ""}{collectedDiff.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs previous month</p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Bills list with filters */}
      <Card className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Bills</h2>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {/* Month picker */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Month</p>
            <BSMonthPicker
              year={filterYear}
              month={filterMonth}
              onChange={(y, m) => { setFilterYear(y); setFilterMonth(m); }}
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <div className="flex flex-wrap gap-1">
              {(["all", "paid", "partial", "pending", "overpaid"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`text-xs px-2 py-1 rounded-md border transition-colors capitalize ${
                    filterStatus === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tenant search */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tenant</p>
            <input
              type="text"
              placeholder="Search name…"
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Room */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Room</p>
            <input
              type="text"
              placeholder="Room number…"
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Reset filters */}
        {(filterStatus !== "all" || filterTenant || filterRoom ||
          filterYear !== cur.year || filterMonth !== cur.month) && (
          <button
            onClick={() => {
              setFilterStatus("all");
              setFilterTenant("");
              setFilterRoom("");
              setFilterYear(cur.year);
              setFilterMonth(cur.month);
            }}
            className="text-xs text-primary underline mb-3"
          >
            Reset filters
          </button>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">
            No bills match your filters for {bsLabel(filterYear, filterMonth)}.{" "}
            {isCurrentMonth && <Link to="/bills/new" className="text-primary underline">Create one</Link>}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <Link
                key={t.bill.id}
                to="/bills/$billId"
                params={{ billId: t.bill.id }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-md border hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base truncate">
                    {t.bill.tenants?.name ?? "—"}
                    <span className="text-muted-foreground text-xs ml-1.5">· Room {t.bill.tenants?.room_number ?? "—"}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {fmtNPR(t.paid)} paid of {fmtNPR(t.total)}
                    {t.total - t.paid > 0 && (
                      <span className="ml-1.5 text-red-500">· {fmtNPR(t.total - t.paid)} due</span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0"><StatusBadge status={t.status} /></div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{filtered.length} bill{filtered.length !== 1 ? "s" : ""}</span>
            <span>· Collected: <strong className="text-foreground">{fmtNPR(filtered.reduce((s, t) => s + t.paid, 0))}</strong></span>
            <span>· Outstanding: <strong className="text-foreground">{fmtNPR(filtered.reduce((s, t) => s + Math.max(0, t.total - t.paid), 0))}</strong></span>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, help }: { label: string; value: string; help: string }) {
  return (
    <Card className="p-2 sm:p-3 lg:p-4">
      <div className="flex items-center gap-0.5 text-xs text-muted-foreground uppercase tracking-wide">
        <span className="line-clamp-2">{label}</span>
        <HelpTip text={help} label={label} />
      </div>
      <div className="text-lg sm:text-xl lg:text-2xl font-display mt-1.5 line-clamp-2">{value}</div>
    </Card>
  );
}
