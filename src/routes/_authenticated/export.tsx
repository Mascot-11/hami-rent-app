import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { getDashboard } from "@/lib/bills.functions";
import { getProfile } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabel } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { bsLabel, bsYearOptions, bsMonthName, approxCurrentBS } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR } from "@/lib/calc";
import { generateStatement, getPeriodLabel, type StatementPeriod } from "@/lib/pdf-statement";
import { Download, FileText, Loader2, Calendar, CalendarDays, CalendarRange, TrendingUp } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/export")({
  head: () => ({ meta: [{ title: "Export — Rent Manager" }] }),
  component: ExportPage,
});

function usePeriodOptions() {
  const { t } = useLanguage();
  return [
    { value: "monthly" as StatementPeriod,  label: t("export.thisMonth"), icon: <Calendar className="h-4 w-4" />,      desc: t("export.thisMonthDesc") },
    { value: "3months" as StatementPeriod,  label: t("export.last3"),     icon: <CalendarDays className="h-4 w-4" />,  desc: t("export.last3Desc") },
    { value: "6months" as StatementPeriod,  label: t("export.last6"),     icon: <CalendarRange className="h-4 w-4" />, desc: t("export.last6Desc") },
    { value: "yearly"  as StatementPeriod,  label: t("export.fullYear"),  icon: <TrendingUp className="h-4 w-4" />,   desc: t("export.fullYearDesc") },
  ];
}

function ExportPage() {
  const { t } = useLanguage();
  const PERIOD_OPTIONS = usePeriodOptions();
  const dashFn    = useServerFn(getDashboard);
  const profileFn = useServerFn(getProfile);

  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const [yearFilter,   setYearFilter]   = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<StatementPeriod>("monthly");
  const [generating, setGenerating] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const current = approxCurrentBS();

  // ── Excel export ──────────────────────────────────────────────────────────
  const exportExcel = async () => {
    if (!data) return;
    setExportingExcel(true);
    try {
      // Small yield so the spinner renders before the sync XLSX work blocks
      await new Promise((r) => setTimeout(r, 30));
      let bills = data.bills as any[];
    if (yearFilter !== "all") bills = bills.filter((b) => b.bs_year === Number(yearFilter));
    if (statusFilter !== "all") {
      bills = bills.filter((b) => computeStatus(b, b.additional_charges ?? [], b.payments ?? []) === statusFilter);
    }

    const summary = bills.map((b) => {
      const total = computeBillTotal(b, b.additional_charges ?? []);
      const paid  = computePaid(b.payments ?? []);
      return {
        Tenant: b.tenants?.name ?? "—",
        Room: b.tenants?.room_number ?? "",
        Month: bsMonthName(b.bs_month),
        Year: b.bs_year,
        Rent: b.rent_this_month,
        Water: b.water_bill,
        "Electricity Mode": b.electricity_mode,
        "Carry-forward": b.carry_forward_credit,
        Total: total,
        Paid: paid,
        Remaining: total - paid,
        Status: computeStatus(b, b.additional_charges ?? [], b.payments ?? []),
        Notes: b.notes ?? "",
      };
    });

    const tenants = (data.tenants as any[]).map((t) => {
      const tBills = bills.filter((b) => b.tenant_id === t.id);
      const totalBilled = tBills.reduce((s, b) => s + computeBillTotal(b, b.additional_charges ?? []), 0);
      const totalPaid   = tBills.reduce((s, b) => s + computePaid(b.payments ?? []), 0);
      return {
        Tenant: t.name, Room: t.room_number ?? "", Phone: t.phone ?? "",
        "Move-in (BS)": t.move_in_date_bs ?? "", Status: t.is_active ? "Active" : "Archived",
        Bills: tBills.length, "Total billed": totalBilled, "Total paid": totalPaid,
        Outstanding: totalBilled - totalPaid,
      };
    });

    const payments: any[] = [];
    bills.forEach((b) => (b.payments ?? []).forEach((p: any) => payments.push({
      Tenant: b.tenants?.name ?? "—",
      "Bill month": bsLabel(b.bs_year, b.bs_month),
      "Payment date (BS)": p.payment_date_bs,
      Amount: p.amount_paid,
      Method: p.payment_method,
      Note: p.note ?? "",
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "Monthly Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tenants), "Tenant Overview");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments), "Payment Ledger");
    XLSX.writeFile(wb, `rent-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Exported");
    } finally {
      setExportingExcel(false);
    }
  };

  // ── PDF statement ─────────────────────────────────────────────────────────
  const downloadStatement = async () => {
    if (!data) return;
    setGenerating(true);
    try {
      await generateStatement(
        data.bills as any[],
        data.tenants as any[],
        selectedPeriod,
        (profile as any)?.full_name || "Landlord",
        (profile as any)?.address || undefined,
      );
      toast.success("Statement downloaded");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setGenerating(false);
    }
  };

  const periodLabel = getPeriodLabel(selectedPeriod, current);

  return (
    <div className="space-y-5 sm:space-y-7 w-full">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display">{t("export.title")}</h1>

      {/* ── PDF Statement ── */}
      <Card className="p-4 sm:p-6 space-y-5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-base">{t("export.downloadStmt")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("export.pdfDesc")}
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedPeriod(opt.value)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                selectedPeriod === opt.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <div className={`${selectedPeriod === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                {opt.icon}
              </div>
              <span className={`text-sm font-semibold ${selectedPeriod === opt.value ? "text-primary" : ""}`}>
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Selected period preview */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">{t("export.period")}</span>
          <span className="font-medium">{periodLabel}</span>
        </div>

        <Button
          onClick={downloadStatement}
          disabled={generating || !data}
          className="w-full sm:w-auto gap-2"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{t("export.generatingPdf")}</>
          ) : (
            <><Download className="h-4 w-4" />{t("export.downloadPdf")}</>
          )}
        </Button>
      </Card>

      {/* ── Excel Export ── */}
      <Card className="p-4 sm:p-5 space-y-4">
        <FieldLabel help={HELP.exportAllTenants}>{t("export.allTenantsExcel")}</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel help={HELP.exportFilterYear}>{t("export.bsYear")}</FieldLabel>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("export.allYears")}</SelectItem>
                {bsYearOptions().map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel help={HELP.exportFilterStatus}>{t("label.status")}</FieldLabel>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("export.allStatuses")}</SelectItem>
                <SelectItem value="paid">{t("label.paid")}</SelectItem>
                <SelectItem value="partial">{t("label.partial")}</SelectItem>
                <SelectItem value="pending">{t("label.pending")}</SelectItem>
                <SelectItem value="overpaid">{t("label.overpaid")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={exportExcel} variant="outline" className="w-full sm:w-auto gap-2" disabled={exportingExcel || !data}>
          {exportingExcel
            ? <><Loader2 className="h-4 w-4 animate-spin" />{t("export.generatingExcel")}</>
            : <><Download className="h-4 w-4" />{t("export.downloadExcel")}</>}
        </Button>
      </Card>
    </div>
  );
}
