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
import { Plus, TrendingUp, TrendingDown, Minus, Users, CheckCircle2, Clock, AlertCircle, FileText } from "lucide-react";
import { useState } from "react";
import { BSMonthPicker } from "@/components/BSMonthPicker";
import { WalkthroughTutorial, useOnboarding } from "@/components/WalkthroughTutorial";
import { EmptyDashboard } from "@/components/EmptyDashboard";
import { useLanguage } from "@/lib/language-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type StatusFilter = "all" | "paid" | "partial" | "pending" | "overpaid";

const PAGE_SIZE = 8;

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function Dashboard() {
  const fn = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const cur = approxCurrentBS();
  const { active: tutorialActive, dismiss: dismissTutorial } = useOnboarding();
  const [tutorialForced, setTutorialForced] = useState(false);
  const { t } = useLanguage();

  const [filterYear, setFilterYear] = useState(cur.year);
  const [filterMonth, setFilterMonth] = useState(cur.month);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterTenant, setFilterTenant] = useState("");
  const [filterRoom, setFilterRoom] = useState("");

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    </div>
  );

  const tenants = data?.tenants ?? [];
  const bills = data?.bills ?? [];
  const active = tenants.filter((t: any) => t.is_active);
  const inactive = tenants.filter((t: any) => !t.is_active);

  // ── Empty state: new user with no tenants ─────────────────────────────────
  // Show tutorial overlay OR inline empty state guide, not the blank dashboard.
  const isNewUser = active.length === 0 && bills.length === 0;
  const tutorialSeen = typeof window !== "undefined"
    ? !!localStorage.getItem("hamrorent_tutorial_done_v2")
    : false;

  if (isNewUser && !tutorialForced) {
    return (
      <>
        {/* Full-screen tour fires automatically for first-timers */}
        <WalkthroughTutorial />
        {/* Inline guide shown once the tour is dismissed or skipped */}
        {!tutorialActive && (
          <EmptyDashboard
            tutorialSeen={tutorialSeen}
            onRestartTutorial={() => {
              localStorage.removeItem("hamrorent_tutorial_done_v2");
              setTutorialForced(true);
              // Re-mount tutorial by briefly forcing it on
              setTimeout(() => setTutorialForced(false), 50);
            }}
          />
        )}
      </>
    );
  }

  // Selected month bills
  const monthBills = bills.filter(
    (b: any) => b.bs_year === filterYear && b.bs_month === filterMonth
  );

  // Previous month
  const prevMonth =
    filterMonth === 1
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

  // Stats for selected month
  const expected = totals.reduce((s, t) => s + t.total, 0);
  const collected = totals.reduce((s, t) => s + t.paid, 0);
  const outstanding = totals.reduce((s, t) => s + Math.max(0, t.total - t.paid), 0);
  const paidCount = totals.filter((t) => t.status === "paid" || t.status === "overpaid").length;
  const partialCount = totals.filter((t) => t.status === "partial").length;
  const pendingCount = totals.filter((t) => t.status === "pending").length;
  const overpaidCount = totals.filter((t) => t.status === "overpaid").length;
  const collectionRate = expected > 0 ? Math.round((collected / expected) * 100) : 0;

  // Previous month stats
  const prevCollected = prevTotals.reduce((s, t) => s + t.paid, 0);
  const prevExpected = prevTotals.reduce((s, t) => s + t.total, 0);
  const collectedDiff =
    prevCollected > 0 ? ((collected - prevCollected) / prevCollected) * 100 : null;

  // Filtered bills list
  const filtered = totals.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (
      filterTenant &&
      !t.bill.tenants?.name?.toLowerCase().includes(filterTenant.toLowerCase())
    )
      return false;
    if (
      filterRoom &&
      !String(t.bill.tenants?.room_number ?? "")
        .toLowerCase()
        .includes(filterRoom.toLowerCase())
    )
      return false;
    return true;
  });

  const isCurrentMonth = filterYear === cur.year && filterMonth === cur.month;
  const rentForMonth = nextBSMonth(filterYear, filterMonth);
  const filtersActive =
    filterStatus !== "all" ||
    filterTenant ||
    filterRoom ||
    filterYear !== cur.year ||
    filterMonth !== cur.month;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">{t("dash.title")}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {isCurrentMonth ? t("dash.currentMonth") : t("dash.viewing")}
            {bsLabel(filterYear, filterMonth)}
            {" · "}Rent advance for {bsMonthName(rentForMonth.month)} {rentForMonth.year}
          </p>
        </div>
        <Link to="/bills/new" className="self-start sm:self-auto flex-shrink-0">
          <Button className="rounded-full px-5 h-9 text-sm gap-1.5 shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            New bill
          </Button>
        </Link>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <Stat
          label={t("dash.activeTenants")}
          value={String(active.length)}
          sub={`${inactive.length} ${t("dash.inactive")}`}
          icon={<Users className="h-4 w-4" />}
          help={HELP.dashActiveTenants}
        />
        <Stat
          label={t("dash.paidThisMonth")}
          value={String(paidCount)}
          sub={`${t("dash.of")} ${totals.length} ${t("label.active").toLowerCase()}`}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          help={HELP.dashPaidThisMonth}
        />
        <Stat
          label={t("dash.pendingPartial")}
          value={`${pendingCount} / ${partialCount}`}
          sub={overpaidCount > 0 ? `${overpaidCount} overpaid` : undefined}
          icon={<Clock className="h-4 w-4 text-yellow-500" />}
          help={HELP.dashPendingThisMonth}
        />
        <Stat
          label={t("dash.collected")}
          value={fmtNPR(collected)}
          sub={`${collectionRate}${t("dash.ofExpected")}`}
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          help={HELP.dashCollected}
        />
        <Stat
          label={t("dash.outstanding")}
          value={fmtNPR(outstanding)}
          sub={`${t("dash.expected")}${fmtNPR(expected)}`}
          icon={<AlertCircle className="h-4 w-4 text-red-400" />}
          help={HELP.dashExpected}
        />
      </div>

      {/* Month-over-month */}
      <Card className="p-3 sm:p-5">
        <h2 className="text-sm sm:text-base font-semibold mb-3">{t("dash.monthOverMonth")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {bsLabel(prevMonth.year, prevMonth.month)}
            </p>
            <p className="text-lg font-display">{fmtNPR(prevCollected)}</p>
            <p className="text-xs text-muted-foreground">
              collected{prevExpected > 0 ? ` · expected ${fmtNPR(prevExpected)}` : ""}
            </p>
          </div>

          <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
            <p className="text-xs text-muted-foreground mb-1">
              {bsLabel(filterYear, filterMonth)}
            </p>
            <p className="text-lg font-display">{fmtNPR(collected)}</p>
            <p className="text-xs text-muted-foreground">
              collected · {fmtNPR(outstanding)} outstanding
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{collectionRate}% collected</p>
          </div>

          <div className="rounded-md bg-muted/40 p-3 flex flex-col justify-center">
            {collectedDiff === null ? (
              <p className="text-xs text-muted-foreground">No data for previous month</p>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  {collectedDiff > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : collectedDiff < 0 ? (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={`text-lg font-display ${
                      collectedDiff > 0
                        ? "text-green-600"
                        : collectedDiff < 0
                        ? "text-red-500"
                        : ""
                    }`}
                  >
                    {collectedDiff > 0 ? "+" : ""}
                    {collectedDiff.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs previous month</p>
                {Math.abs(collected - prevCollected) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {collected > prevCollected ? "+" : ""}
                    {fmtNPR(collected - prevCollected)} difference
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Bills list with filters */}
      <Card className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {t("dash.bills")}
          </h2>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("label.month")}</p>
            <BSMonthPicker
              year={filterYear}
              month={filterMonth}
              onChange={(y, m) => {
                setFilterYear(y);
                setFilterMonth(m);
              }}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("label.status")}</p>
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
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("label.tenant")}</p>
            <input
              type="text"
              placeholder={t("dash.searchName")}
              value={filterTenant}
              onChange={(e) => setFilterTenant(e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("label.room")}</p>
            <input
              type="text"
              placeholder={t("dash.roomNumber")}
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {filtersActive && (
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

        {filtered.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">
            No bills match your filters for {bsLabel(filterYear, filterMonth)}.{" "}
            {isCurrentMonth && (
              <Link to="/bills/new" className="text-primary underline">
                Create one
              </Link>
            )}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const due = t.total - t.paid;
              return (
                <Link
                  key={t.bill.id}
                  to="/bills/$billId"
                  params={{ billId: t.bill.id }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-md border hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate">
                      {t.bill.tenants?.name ?? "—"}
                      <span className="text-muted-foreground text-xs ml-1.5">
                        · Room {t.bill.tenants?.room_number ?? "—"}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {fmtNPR(t.paid)} paid of {fmtNPR(t.total)}
                      {due > 0 && (
                        <span className="ml-1.5 text-red-500">· {fmtNPR(due)} due</span>
                      )}
                      {due < 0 && (
                        <span className="ml-1.5 text-green-600">
                          · {fmtNPR(Math.abs(due))} credit
                        </span>
                      )}
                    </div>
                    {/* Mini progress bar */}
                    <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden w-32 sm:w-48">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, t.total > 0 ? (t.paid / t.total) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              {filtered.length} bill{filtered.length !== 1 ? "s" : ""}
            </span>
            <span>
              · Collected:{" "}
              <strong className="text-foreground">
                {fmtNPR(filtered.reduce((s, t) => s + t.paid, 0))}
              </strong>
            </span>
            <span>
              · Outstanding:{" "}
              <strong className="text-foreground">
                {fmtNPR(
                  filtered.reduce((s, t) => s + Math.max(0, t.total - t.paid), 0)
                )}
              </strong>
            </span>
            <span>
              · Expected:{" "}
              <strong className="text-foreground">
                {fmtNPR(filtered.reduce((s, t) => s + t.total, 0))}
              </strong>
            </span>
          </div>
        )}
      </Card>

      {/* Billed / Not Billed breakdown */}
      <BilledBreakdown
        allActiveTenants={active}
        monthBills={monthBills}
        year={filterYear}
        month={filterMonth}
      />
    </div>
  );
}

// ─── Billed / Not Billed ──────────────────────────────────────────────────────

function BilledBreakdown({
  allActiveTenants,
  monthBills,
  year,
  month,
}: {
  allActiveTenants: any[];
  monthBills: any[];
  year: number;
  month: number;
}) {
  const [billedPage, setBilledPage] = useState(1);
  const [notBilledPage, setNotBilledPage] = useState(1);

  // Support both tenant_id field and nested tenants.id
  const billedTenantIds = new Set(
    monthBills.map((b: any) => b.tenant_id ?? b.tenants?.id)
  );

  const billed = allActiveTenants.filter((t) => billedTenantIds.has(t.id));
  const notBilled = allActiveTenants.filter((t) => !billedTenantIds.has(t.id));

  const billedPages = Math.max(1, Math.ceil(billed.length / PAGE_SIZE));
  const notBilledPages = Math.max(1, Math.ceil(notBilled.length / PAGE_SIZE));

  const billedSlice = billed.slice(
    (billedPage - 1) * PAGE_SIZE,
    billedPage * PAGE_SIZE
  );
  const notBilledSlice = notBilled.slice(
    (notBilledPage - 1) * PAGE_SIZE,
    notBilledPage * PAGE_SIZE
  );

  // Find the bill for each billed tenant so we can show status
  const billByTenantId = new Map(
    monthBills.map((b: any) => [b.tenant_id ?? b.tenants?.id, b])
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Billed */}
      <Card className="p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
            Billed
            <span className="text-xs text-muted-foreground font-normal">
              ({billed.length} of {allActiveTenants.length})
            </span>
          </h2>
        </div>

        {billed.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No tenants billed for {bsLabel(year, month)}.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              {billedSlice.map((t) => {
                const b = billByTenantId.get(t.id);
                const total = b ? computeBillTotal(b, b.additional_charges ?? []) : 0;
                const paid = b ? computePaid(b.payments ?? []) : 0;
                const status = b
                  ? (computeStatus(b, b.additional_charges ?? [], b.payments ?? []) as BillStatus)
                  : null;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/30 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{t.name}</div>
                      {t.room_number && (
                        <div className="text-xs text-muted-foreground">
                          Room {t.room_number}
                        </div>
                      )}
                      {b && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {fmtNPR(paid)} / {fmtNPR(total)}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {status && <StatusBadge status={status} />}
                      {b && (
                        <Link
                          to="/bills/$billId"
                          params={{ billId: b.id }}
                          className="text-xs text-primary underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              page={billedPage}
              totalPages={billedPages}
              onChange={setBilledPage}
            />
          </>
        )}
      </Card>

      {/* Not Billed */}
      <Card className="p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            Not Billed
            <span className="text-xs text-muted-foreground font-normal">
              ({notBilled.length} of {allActiveTenants.length})
            </span>
          </h2>
        </div>

        {notBilled.length === 0 ? (
          <p className="text-xs text-green-600 text-sm font-medium">
            ✓ All active tenants have been billed for {bsLabel(year, month)}.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              {notBilledSlice.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/30 gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{t.name}</div>
                    {t.room_number && (
                      <div className="text-xs text-muted-foreground">
                        Room {t.room_number}
                      </div>
                    )}
                    {t.move_in_date_bs && (
                      <div className="text-xs text-muted-foreground">
                        Moved in: {t.move_in_date_bs}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/bills/new"
                    search={{ tenantId: t.id }}
                    className="shrink-0 text-xs px-2 py-1 rounded-md border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    + Bill
                  </Link>
                </div>
              ))}
            </div>
            <Pagination
              page={notBilledPage}
              totalPages={notBilledPages}
              onChange={setNotBilledPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="text-xs px-2 py-1 rounded border disabled:opacity-40 hover:bg-accent transition-colors"
      >
        ← Prev
      </button>
      <span className="text-xs text-muted-foreground">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="text-xs px-2 py-1 rounded border disabled:opacity-40 hover:bg-accent transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  sub,
  icon,
  help,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  help: string;
}) {
  return (
    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-0.5">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide font-semibold line-clamp-1">{label}</span>
          <HelpTip text={help} label={label} />
        </div>
        {icon && <div className="text-muted-foreground opacity-60">{icon}</div>}
      </div>
      <div className="text-lg sm:text-xl lg:text-2xl font-display mt-1 line-clamp-2 font-bold">
        {value}
      </div>
      {sub && <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}
