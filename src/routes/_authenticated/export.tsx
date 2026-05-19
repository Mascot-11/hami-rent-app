import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getDashboard } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { HELP } from "@/lib/help-copy";
import { bsLabel, bsYearOptions, bsMonthName } from "@/lib/bs-calendar";
import { computeBillTotal, computePaid, computeStatus, fmtNPR } from "@/lib/calc";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/export")({
  head: () => ({ meta: [{ title: "Export — Rent Manager" }] }),
  component: ExportPage,
});

function ExportPage() {
  const fn = useServerFn(getDashboard);
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const exportAll = () => {
    if (!data) return;
    let bills = data.bills as any[];
    if (yearFilter !== "all") bills = bills.filter((b) => b.bs_year === Number(yearFilter));
    if (statusFilter !== "all") {
      bills = bills.filter((b) => computeStatus(b, b.additional_charges ?? [], b.payments ?? []) === statusFilter);
    }

    const summary = bills.map((b) => {
      const total = computeBillTotal(b, b.additional_charges ?? []);
      const paid = computePaid(b.payments ?? []);
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
      const totalPaid = tBills.reduce((s, b) => s + computePaid(b.payments ?? []), 0);
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
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-display">Export</h1>
      <Card className="p-5 space-y-4">
        <FieldLabel help={HELP.exportAllTenants}>All-tenants Excel export</FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel help={HELP.exportFilterYear}>BS Year</FieldLabel>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {bsYearOptions().map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel help={HELP.exportFilterStatus}>Status</FieldLabel>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overpaid">Overpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={exportAll}><Download className="h-4 w-4 mr-1.5" />Download Excel</Button>
      </Card>
    </div>
  );
}
