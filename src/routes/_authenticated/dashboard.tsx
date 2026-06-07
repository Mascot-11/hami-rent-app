import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboard } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/HelpTip";
import { StatusBadge } from "@/components/StatusBadge";
import { HELP } from "@/lib/help-copy";
import { approxCurrentBS, bsLabel, bsMonthName, nextBSMonth } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, type BillStatus } from "@/lib/calc";
import { Plus, TrendingUp, TrendingDown, Minus, Users, CheckCircle2, Clock, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { BSMonthPicker } from "@/components/BSMonthPicker";
import { offlineDB } from "@/lib/offline-db";
import { usePWAContext } from "@/components/PWAProvider";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hamro Rent" }] }),
  component: Dashboard,
});

type StatusFilter = "all" | "paid" | "partial" | "pending" | "overpaid";
const PAGE_SIZE = 8;

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const pwa = usePWAContext();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const result = await fn();
      // Seed IndexedDB with fresh data for offline use
      if (result) {
        offlineDB.seedAll({
          tenants: result.tenants ?? [],
          bills: result.bills ?? [],
        }).catch(console.error);
      }
      return result;
    },
  });

  const cur = approxCurrentBS();
  const [filterYear, setFilterYear] = useState(cur.year);
  const [filterMonth, setFilterMonth] = useState(cur.month);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [page, setPage] = useState(1);
  const [notBilledPage, setNotBilledPage] = useState(1);

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading dashboard…</span>
      </div>
    </div>
  );

  const tenants = data?.tenants ?? [];
  const bills = data?.bills ?? [];
  const active = tenants.filter((t: any) => t.is_active);
  const inactive = tenants.filter((t: any) => !t.is_active);

  const monthBills = bills.filter(
    (b: any) => b.bs_year === filterYear && b.bs_month === filterMonth
  );

  const prevMonth = filterMonth === 1
    ? { year: filterYear - 1, month: 12 }
    : { year: filterYear, month: filterMonth - 1 };
  const prevMonthBills = bills.filter(
    (b: any) => b.bs_year === prevMonth.year && b.bs_month === prevMonth.month
  );

  const enrichBills = (bs: any[]) =>
    bs.map((b) => ({
      bill: b,
      total: computeBillTotal(b, b.additional_charges ?? []),
      paid: computePaid(b.payments ?? []),
      status: computeStatus(b, b.additional_charges ?? [], b.payments ?? []) as BillStatus,
    }));

  const totals = enrichBills(monthBills);
  const prevTotals = enrichBills(prevMonthBills);

  const expected = totals.reduce((s, t) => s + t.total, 0);
  const collected = totals.reduce((s, t) => s + t.paid, 0);
  const outstanding = totals.reduce((s, t) => s + Math.max(0, t.total - t.paid), 0);
  const paidCount = totals.filter((t) => t.status === "paid" || t.status === "overpaid").length;
  const partialCount = totals.filter((t) => t.status === "partial").length;
  const pendingCount = totals.filter((t) => t.status === "pending").length;
  const overpaidCount = totals.filter((t) => t.status === "overpaid").length;
  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  const prevExpected = prevTotals.reduce((s, t) => s + t.total, 0);
  const prevCollected = prevTotals.reduce((s, t) => s + t.paid, 0);
  const expectedDelta = expected - prevExpected;
  const collectedDelta = collected - prevCollected;

  const billedIds = new Set(monthBills.map((b: any) => b.tenant_id));
  const notBilled = active.filter((t: any) => !billedIds.has(t.id));

  const filteredBills = totals.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    const tenant = tenants.find((tn: any) => tn.id === t.bill.tenant_id);
    if (filterTenant && !tenant?.name.toLowerCase().includes(filterTenant.toLowerCase())) return false;
    if (filterRoom && !tenant?.room_number?.toLowerCase().includes(filterRoom.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredBills.length / PAGE_SIZE);
  const paginatedBills = filteredBills.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const notBilledPages = Math.ceil(notBilled.length / PAGE_SIZE);
  const paginatedNotBilled = notBilled.slice((notBilledPage - 1) * PAGE_SIZE, notBilledPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {bsMonthName(filterMonth)} {filterYear} BS
            {!pwa.isOnline && <span className="ml-2 text-warning font-medium">· Offline</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BSMonthPicker
            year={filterYear}
            month={filterMonth}
            onChange={(y, m) => { setFilterYear(y); setFilterMonth(m); setPage(1); }}
          />
          <Link to="/bills/new">
            <Button size="sm" className="gap-1.5 h-9">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Bill</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Expected"
          value={fmtNPR(expected)}
          sub={expectedDelta !== 0 ? `${expectedDelta > 0 ? "+" : ""}${fmtNPR(expectedDelta)} vs last month` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          help={HELP.statExpected}
        />
        <Stat
          label="Collected"
          value={fmtNPR(collected)}
          sub={collectedDelta !== 0 ? `${collectedDelta > 0 ? "+" : ""}${fmtNPR(collectedDelta)} vs last month` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          help={HELP.statCollected}
        />
        <Stat
          label="Outstanding"
          value={fmtNPR(outstanding)}
          icon={<AlertCircle className="h-4 w-4" />}
          help={HELP.statOutstanding}
        />
        <Stat
          label="Collection Rate"
          value={`${collectionRate}%`}
          sub={`${paidCount} paid of ${totals.length}`}
          icon={collectionRate >= 80 ? <TrendingUp className="h-4 w-4" /> : collectionRate >= 50 ? <Minus className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          help={HELP.statRate}
        />
      </div>

      {/* ── Status pills ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Paid", count: paidCount, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-success", filter: "paid" as StatusFilter },
          { label: "Partial", count: partialCount, icon: <Clock className="h-4 w-4" />, color: "text-warning", filter: "partial" as StatusFilter },
          { label: "Pending", count: pendingCount, icon: <AlertCircle className="h-4 w-4" />, color: "text-muted-foreground", filter: "pending" as StatusFilter },
          { label: "Overpaid", count: overpaidCount, icon: <TrendingUp className="h-4 w-4" />, color: "text-info", filter: "overpaid" as StatusFilter },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => { setFilterStatus(filterStatus === s.filter ? "all" : s.filter); setPage(1); }}
            className={`rounded-xl border p-3 text-center transition-all hover:shadow-sm ${
              filterStatus === s.filter
                ? "border-primary/40 bg-primary/8 shadow-sm"
                : "border-border bg-card hover:bg-accent/40"
            }`}
          >
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <div className="text-xl font-display font-bold">{s.count}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </button>
        ))}
      </div>

      {/* ── Bills table ── */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-4 border-b border-border">
          <h2 className="font-semibold mr-auto">{bsMonthName(filterMonth)} {filterYear}</h2>
          <input
            value={filterTenant}
            onChange={(e) => { setFilterTenant(e.target.value); setPage(1); }}
            placeholder="Filter by name…"
            className="text-xs h-8 px-3 rounded-lg border border-border bg-background w-32 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            value={filterRoom}
            onChange={(e) => { setFilterRoom(e.target.value); setPage(1); }}
            placeholder="Room…"
            className="text-xs h-8 px-3 rounded-lg border border-border bg-background w-20 focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {paginatedBills.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No bills found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {paginatedBills.map(({ bill, total, paid, status }) => {
              const tenant = tenants.find((t: any) => t.id === bill.tenant_id);
              return (
                <Link
                  key={bill.id}
                  to="/bills/$billId"
                  params={{ billId: bill.id }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/12 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0">
                    {tenant?.name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{tenant?.name ?? "—"}</div>
                    {tenant?.room_number && (
                      <div className="text-xs text-muted-foreground">Room {tenant.room_number}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm font-semibold">{fmtNPR(total)}</div>
                      <div className="text-xs text-muted-foreground">
                        {paid > 0 ? `Paid ${fmtNPR(paid)}` : "Unpaid"}
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-accent transition-colors">← Prev</button>
            <span>{page} / {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-2 py-1 rounded border border-border disabled:opacity-40 hover:bg-accent transition-colors">Next →</button>
          </div>
        )}
      </Card>

      {/* ── Not yet billed ── */}
      {notBilled.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Not yet billed — {bsMonthName(filterMonth)}
              <span className="bg-warning/20 text-warning text-xs rounded-full px-2 py-0.5 font-medium">{notBilled.length}</span>
            </h2>
          </div>
          <div className="divide-y divide-border">
            {paginatedNotBilled.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">{t.name[0]}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{t.name}</div>
                    {t.room_number && <div className="text-xs text-muted-foreground">Room {t.room_number}</div>}
                  </div>
                </div>
                <Link
                  to="/bills/new"
                  search={{ tenantId: t.id }}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  + Bill
                </Link>
              </div>
            ))}
          </div>
          {notBilledPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
              <button onClick={() => setNotBilledPage(notBilledPage - 1)} disabled={notBilledPage === 1} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-accent">← Prev</button>
              <span>{notBilledPage} / {notBilledPages}</span>
              <button onClick={() => setNotBilledPage(notBilledPage + 1)} disabled={notBilledPage === notBilledPages} className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-accent">Next →</button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, sub, icon, help }: {
  label: string; value: string; sub?: string; icon?: React.ReactNode; help: string;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground uppercase tracking-wide">
          <span className="line-clamp-1">{label}</span>
          <HelpTip text={help} label={label} />
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="text-xl sm:text-2xl font-display font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{sub}</div>}
    </Card>
  );
}
