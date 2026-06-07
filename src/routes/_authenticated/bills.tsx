import { createFileRoute, Link, useNavigate, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { listBills } from "@/lib/bills.functions";
import { listTenants } from "@/lib/tenants.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { BSMonthPicker } from "@/components/BSMonthPicker";
import {
  approxCurrentBS,
  bsLabel,
  bsMonthName,
  bsYearOptions,
  nextBSMonth,
} from "@/lib/bs-calendar";
import {
  computeBillTotal,
  computePaid,
  computeRemaining,
  computeStatus,
  fmtNPR,
  type BillStatus,
} from "@/lib/calc";
import {
  FileText,
  Plus,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Banknote,
  AlertCircle,
  ChevronRight,
  Filter,
  SortAsc,
  SortDesc,
  Receipt,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/bills")({
  head: () => ({ meta: [{ title: "Bills — Hamro Rent" }] }),
  component: BillsPage,
});

type StatusFilter = "all" | "paid" | "partial" | "pending" | "overpaid";
type SortField = "month" | "tenant" | "total" | "remaining" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 12;

// ─── Page ─────────────────────────────────────────────────────────────────────

function BillsPage() {
  const billsFn = useServerFn(listBills);
  const tenantsFn = useServerFn(listTenants);
  const cur = approxCurrentBS();
  const navigate = useNavigate();

  // Filters
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterMonth, setFilterMonth] = useState<number | "all">("all");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("month");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"month" | "all">("month");

  // Month filter state (for BSMonthPicker)
  const [pickerYear, setPickerYear] = useState(cur.year);
  const [pickerMonth, setPickerMonth] = useState(cur.month);

  const { data: allBills = [], isLoading } = useQuery({
    queryKey: ["bills-all"],
    queryFn: () => billsFn({ data: {} }),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => tenantsFn(),
  });

  // Enrich bills
  const enriched = useMemo(() =>
    (allBills as any[]).map((b) => {
      const charges = b.additional_charges ?? [];
      const payments = b.payments ?? [];
      const total = computeBillTotal(b, charges);
      const paid = computePaid(payments);
      const remaining = computeRemaining(b, charges, payments);
      const status = computeStatus(b, charges, payments) as BillStatus;
      return { bill: b, total, paid, remaining, status };
    }),
    [allBills]
  );

  // Apply filters
  const filtered = useMemo(() => {
    let items = enriched;

    if (viewMode === "month") {
      items = items.filter(
        (e) => e.bill.bs_year === pickerYear && e.bill.bs_month === pickerMonth
      );
    }
    if (filterStatus !== "all") {
      items = items.filter((e) => e.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.bill.tenants?.name?.toLowerCase().includes(q) ||
          String(e.bill.tenants?.room_number ?? "").toLowerCase().includes(q) ||
          bsLabel(e.bill.bs_year, e.bill.bs_month).toLowerCase().includes(q)
      );
    }

    // Sort
    items = [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "month":
          cmp = a.bill.bs_year !== b.bill.bs_year
            ? a.bill.bs_year - b.bill.bs_year
            : a.bill.bs_month - b.bill.bs_month;
          break;
        case "tenant":
          cmp = (a.bill.tenants?.name ?? "").localeCompare(b.bill.tenants?.name ?? "");
          break;
        case "total":
          cmp = a.total - b.total;
          break;
        case "remaining":
          cmp = a.remaining - b.remaining;
          break;
        case "status": {
          const order = { pending: 0, partial: 1, overpaid: 2, paid: 3 };
          cmp = (order[a.status] ?? 0) - (order[b.status] ?? 0);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [enriched, viewMode, pickerYear, pickerMonth, filterStatus, search, sortField, sortDir]);

  // Summary stats
  const stats = useMemo(() => {
    const expected = filtered.reduce((s, e) => s + e.total, 0);
    const collected = filtered.reduce((s, e) => s + e.paid, 0);
    const outstanding = filtered.reduce((s, e) => s + Math.max(0, e.remaining), 0);
    const paidCount = filtered.filter((e) => e.status === "paid" || e.status === "overpaid").length;
    const pendingCount = filtered.filter((e) => e.status === "pending").length;
    const partialCount = filtered.filter((e) => e.status === "partial").length;
    const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
    return { expected, collected, outstanding, paidCount, pendingCount, partialCount, rate, total: filtered.length };
  }, [filtered]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const anyFiltersActive =
    filterStatus !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setFilterStatus("all");
    setSearch("");
    setPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <SortAsc className="h-3 w-3 opacity-30" />;
    return sortDir === "asc"
      ? <SortAsc className="h-3 w-3 text-primary" />
      : <SortDesc className="h-3 w-3 text-primary" />;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">Bills</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${(allBills as any[]).length} total bills across all tenants`}
          </p>
        </div>
        <Link to="/bills/new">
          <Button className="w-full sm:w-auto gap-1.5">
            <Plus className="h-4 w-4" /> New bill
          </Button>
        </Link>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        <button
          onClick={() => { setViewMode("month"); setPage(1); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewMode === "month"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          By month
        </button>
        <button
          onClick={() => { setViewMode("all"); setPage(1); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            viewMode === "all"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All bills
        </button>
      </div>

      {/* Month picker (only in "by month" mode) */}
      {viewMode === "month" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground font-medium">Viewing month</p>
            <BSMonthPicker
              year={pickerYear}
              month={pickerMonth}
              onChange={(y, m) => { setPickerYear(y); setPickerMonth(m); setPage(1); }}
            />
          </div>
          {(pickerYear !== cur.year || pickerMonth !== cur.month) && (
            <button
              onClick={() => { setPickerYear(cur.year); setPickerMonth(cur.month); setPage(1); }}
              className="text-xs text-primary underline mt-4"
            >
              Back to current month
            </button>
          )}
        </div>
      )}

      {/* Stats row */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatCard
            label="Bills"
            value={String(stats.total)}
            sub={`${stats.paidCount} paid · ${stats.pendingCount} pending`}
            icon={<Receipt className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Expected"
            value={fmtNPR(stats.expected)}
            sub={`${stats.rate}% collected`}
            icon={<Banknote className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Collected"
            value={fmtNPR(stats.collected)}
            sub={stats.partialCount > 0 ? `${stats.partialCount} partial` : ""}
            icon={<TrendingUp className="h-4 w-4 text-green-600" />}
            valueClass="text-green-700"
          />
          <StatCard
            label="Outstanding"
            value={fmtNPR(stats.outstanding)}
            sub={stats.outstanding > 0 ? "needs collection" : "all clear ✓"}
            icon={<AlertCircle className="h-4 w-4 text-red-400" />}
            valueClass={stats.outstanding > 0 ? "text-red-600" : "text-green-700"}
          />
        </div>
      )}

      {/* Collection progress bar */}
      {!isLoading && stats.total > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">Collection rate</span>
            <span className="font-semibold text-primary">{stats.rate}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>Collected: {fmtNPR(stats.collected)}</span>
            <span>Outstanding: {fmtNPR(stats.outstanding)}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tenant, room…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex gap-1 flex-wrap">
            {(["all", "paid", "partial", "pending", "overpaid"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  filterStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent text-muted-foreground"
                }`}
              >
                {s === "all" ? `All (${enriched.length})` : s}
              </button>
            ))}
          </div>

          {anyFiltersActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary underline whitespace-nowrap self-center"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Bills table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState viewMode={viewMode} pickerYear={pickerYear} pickerMonth={pickerMonth} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <Th onClick={() => toggleSort("tenant")} label="Tenant">
                      <SortIcon field="tenant" />
                    </Th>
                    {viewMode === "all" && (
                      <Th onClick={() => toggleSort("month")} label="Month">
                        <SortIcon field="month" />
                      </Th>
                    )}
                    <Th onClick={() => toggleSort("total")} label="Total" right>
                      <SortIcon field="total" />
                    </Th>
                    <Th onClick={() => toggleSort("remaining")} label="Outstanding" right>
                      <SortIcon field="remaining" />
                    </Th>
                    <Th onClick={() => toggleSort("status")} label="Status">
                      <SortIcon field="status" />
                    </Th>
                    <th className="px-4 py-2.5 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(({ bill, total, paid, remaining, status }) => {
                    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                    const rentFor = nextBSMonth(bill.bs_year, bill.bs_month);
                    return (
                      <tr
                        key={bill.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => navigate({ to: "/bills/$billId", params: { billId: bill.id } })}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{bill.tenants?.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            Room {bill.tenants?.room_number ?? "—"}
                          </div>
                        </td>
                        {viewMode === "all" && (
                          <td className="px-4 py-3">
                            <div className="font-medium">{bsLabel(bill.bs_year, bill.bs_month)}</div>
                            <div className="text-xs text-muted-foreground">
                              Rent: {bsMonthName(rentFor.month)}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold">{fmtNPR(total)}</div>
                          <div className="text-xs text-muted-foreground">{fmtNPR(paid)} paid</div>
                          {/* Mini progress */}
                          <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden w-20 ml-auto">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold text-sm ${
                            remaining > 0 ? "text-red-600" : remaining < 0 ? "text-blue-600" : "text-green-600"
                          }`}>
                            {remaining === 0 ? "—" : fmtNPR(Math.abs(remaining))}
                          </span>
                          {remaining < 0 && (
                            <div className="text-xs text-blue-500">credit</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/bills/$billId"
                            params={{ billId: bill.id }}
                            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {paginated.map(({ bill, total, paid, remaining, status }) => {
              const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
              return (
                <Link
                  key={bill.id}
                  to="/bills/$billId"
                  params={{ billId: bill.id }}
                  className="block"
                >
                  <Card className="p-3.5 hover:shadow-md transition-shadow active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{bill.tenants?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          Room {bill.tenants?.room_number ?? "—"}
                          {viewMode === "all" && ` · ${bsLabel(bill.bs_year, bill.bs_month)}`}
                        </p>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-bold">{fmtNPR(total)}</span>
                        <span className="text-xs text-muted-foreground ml-1">total</span>
                      </div>
                      {remaining > 0 && (
                        <span className="text-xs font-medium text-red-600">{fmtNPR(remaining)} due</span>
                      )}
                      {remaining === 0 && (
                        <span className="text-xs font-medium text-green-600">Fully paid</span>
                      )}
                      {remaining < 0 && (
                        <span className="text-xs font-medium text-blue-600">{fmtNPR(Math.abs(remaining))} credit</span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination + summary */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <p className="text-xs text-muted-foreground order-2 sm:order-1">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} bills
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-accent transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="px-2 text-xs text-muted-foreground">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                          page === p
                            ? "bg-primary text-primary-foreground"
                            : "border hover:bg-accent"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border text-xs disabled:opacity-40 hover:bg-accent transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Th({
  label, onClick, right, children,
}: { label: string; onClick: () => void; right?: boolean; children?: React.ReactNode }) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground transition-colors select-none ${right ? "text-right" : "text-left"}`}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "justify-end" : ""}`}>
        {label} {children}
      </span>
    </th>
  );
}

function StatCard({
  label, value, sub, icon, valueClass = "",
}: { label: string; value: string; sub?: string; icon: React.ReactNode; valueClass?: string }) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        {icon}
      </div>
      <p className={`font-display text-lg sm:text-xl font-semibold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}

function EmptyState({
  viewMode, pickerYear, pickerMonth,
}: { viewMode: string; pickerYear: number; pickerMonth: number }) {
  return (
    <Card className="p-10 sm:p-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="font-semibold text-lg mb-1">No bills found</p>
      <p className="text-sm text-muted-foreground mb-5">
        {viewMode === "month"
          ? `No bills for ${bsLabel(pickerYear, pickerMonth)}. Try a different month or create one.`
          : "No bills match your current filters."}
      </p>
      <Link to="/bills/new">
        <Button className="gap-1.5">
          <Plus className="h-4 w-4" /> Create bill
        </Button>
      </Link>
    </Card>
  );
}
