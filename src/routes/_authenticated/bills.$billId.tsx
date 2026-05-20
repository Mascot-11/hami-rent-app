import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getBill, deleteBill, recordPayment, deletePayment } from "@/lib/bills.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldLabel, HelpTip } from "@/components/HelpTip";
import { StatusBadge } from "@/components/StatusBadge";
import { HELP } from "@/lib/help-copy";
import { bsLabel, bsMonthName, nextBSMonth } from "@/lib/bs-calendar";
import { computeBillTotal, computeElectricity, computePaid, computeRemaining, computeStatus, fmtNPR, type PaymentMethod, type BillStatus } from "@/lib/calc";
import { Trash2, Share2, FileDown } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/_authenticated/bills/$billId")({
  head: () => ({ meta: [{ title: "Bill — Rent Manager" }] }),
  component: BillPage,
});

function BillPage() {
  const { billId } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const fn = useServerFn(getBill);
  const delFn = useServerFn(deleteBill);
  const payFn = useServerFn(recordPayment);
  const delPayFn = useServerFn(deletePayment);

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", billId],
    queryFn: () => fn({ data: { id: billId } }),
  });

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  const pay = useMutation({
    mutationFn: () => payFn({ data: { bill_id: billId, payment_date_bs: date, amount_paid: Number(amount), payment_method: method, note: note || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bill", billId] });
      setAmount(""); setNote(""); setDate("");
      toast.success("Payment recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removePay = useMutation({
    mutationFn: (id: string) => delPayFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bill", billId] });
      toast.success("Removed");
    },
  });

  const removeBill = useMutation({
    mutationFn: () => delFn({ data: { id: billId } }),
    onSuccess: () => { toast.success("Bill deleted"); nav({ to: "/dashboard" }); },
  });

  if (isLoading || !bill) return <p className="text-muted-foreground">Loading…</p>;

  const charges = bill.additional_charges ?? [];
  const payments = bill.payments ?? [];
  const total = computeBillTotal(bill, charges);
  const paid = computePaid(payments);
  const remaining = computeRemaining(bill, charges, payments);
  const status = computeStatus(bill, charges, payments) as BillStatus;
  const elec = computeElectricity(bill);

  // Rent is collected in advance — the bill month's rent is for the NEXT BS month
  const rentForMonth = nextBSMonth(bill.bs_year, bill.bs_month);
  const rentLabel = `Rent for ${bsMonthName(rentForMonth.month)} ${rentForMonth.year}`;

  const submitPay = (e: any) => {
    e.preventDefault();
    if (!date.trim()) return toast.error("Payment date is required");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Amount must be > 0");
    if (amt > remaining && remaining > 0) {
      if (!confirm(`Amount exceeds remaining ${fmtNPR(remaining)}. Continue? Surplus becomes overpayment.`)) return;
    }
    pay.mutate();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 no-print">
        <div>
          <Link to="/tenants/$tenantId" params={{ tenantId: bill.tenant_id }} className="text-sm text-primary underline">
            ← {bill.tenants?.name}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-display mt-1">{bsLabel(bill.bs_year, bill.bs_month)}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Electricity &amp; utilities for {bsMonthName(bill.bs_month)} · Rent advance for {bsMonthName(rentForMonth.month)} {rentForMonth.year}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <StatusBadge status={status} />
          <Button variant="outline" size="sm" onClick={() => window.print()} title="Opens print dialog — choose 'Save as PDF'" className="text-xs sm:text-sm">
            <FileDown className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>
          </Button>
          <Button
  variant="outline"
  size="sm"
  onClick={async () => {
    const url = `${window.location.origin}/share/${bill.share_token}`;

    try {
      // Mobile share support
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share({
          title: `Bill — ${bill.tenants?.name}`,
          url,
        });

        return;
      }

      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Windows / older browser fallback
        const textArea = document.createElement("textarea");
        textArea.value = url;

        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        textArea.remove();
      }

      toast.success("Share link copied");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy share link");
    }
  }}
  className="text-xs sm:text-sm"
>
            <Share2 className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Share link</span><span className="sm:hidden">Share</span>
          </Button>
          <HelpTip text={HELP.shareLink} label="Share" />
          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this bill and all its payments?")) removeBill.mutate(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:flex items-center gap-3 border-b pb-3">
        <img src={logo} alt="" className="h-12 w-12 rounded-full object-cover" />
        <div>
          <div className="font-display text-xl">Hamro Rent</div>
          <div className="text-xs text-muted-foreground">
            {bill.tenants?.name} · Room {bill.tenants?.room_number ?? "—"} · {bsLabel(bill.bs_year, bill.bs_month)}
          </div>
          <div className="text-xs text-muted-foreground">
            Rent advance for {bsMonthName(rentForMonth.month)} {rentForMonth.year}
          </div>
        </div>
      </div>

      <Card className="p-3 sm:p-5">
        <div className="mb-3">
  <h2 className="text-base sm:text-lg font-semibold">
    Bill breakdown
  </h2>

  <div className="mt-1 text-sm text-muted-foreground">
    Tenant: <span className="font-medium text-foreground">{bill.tenants?.name}</span>
  </div>

  {bill.tenants?.room_number && (
    <div className="text-sm text-muted-foreground">
      Room: <span className="font-medium text-foreground">{bill.tenants.room_number}</span>
    </div>
  )}
</div>
        <Row label={rentLabel} value={fmtNPR(bill.rent_this_month)} />
        <Row label={`Water — ${bsMonthName(bill.bs_month)}`} value={fmtNPR(bill.water_bill)} />
        <Row
          label={`Electricity — ${bsMonthName(bill.bs_month)} (${bill.electricity_mode === "per_unit" ? "per unit" : "direct"})`}
          value={fmtNPR(elec)}
        />
        {charges.map((c: any) => <Row key={c.id} label={c.label} value={fmtNPR(c.amount)} />)}
        {bill.carry_forward_credit > 0 && (
          <Row label="Carry-forward credit" value={`− ${fmtNPR(bill.carry_forward_credit)}`} />
        )}
        <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-base sm:text-lg">
          <span className="flex items-center gap-1.5">Total <HelpTip text={HELP.billTotal} label="Total" /></span>
          <span>{fmtNPR(total)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm mt-2">
          <span>Paid</span><span>{fmtNPR(paid)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-1.5">Remaining <HelpTip text={HELP.remainingBalance} label="Remaining" /></span>
          <span>{fmtNPR(remaining)}</span>
        </div>
        {bill.notes && <p className="text-xs sm:text-sm text-muted-foreground mt-3 italic">{bill.notes}</p>}
      </Card>

      <Card className="p-3 sm:p-5 no-print">
        <h2 className="text-base sm:text-lg font-semibold mb-3">Record payment</h2>
        <form onSubmit={submitPay} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><FieldLabel help={HELP.paymentDate} required>Date (BS)</FieldLabel>
            <Input placeholder="2081-05-12" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><FieldLabel help={HELP.paymentAmount} required>Amount (NPR)</FieldLabel>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><FieldLabel help={HELP.paymentMethod} required>Method</FieldLabel>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="esewa">eSewa</SelectItem>
                <SelectItem value="khalti">Khalti</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><FieldLabel help={HELP.paymentNote}>Note</FieldLabel>
            <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="col-span-full">
            <Button type="submit" disabled={pay.isPending} className="w-full">
              {pay.isPending ? "Saving…" : "Add payment"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-3 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold mb-3">Payments ({payments.length})</h2>
        {payments.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-2 gap-1.5 sm:gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm sm:text-base">
                    {fmtNPR(p.amount_paid)} <span className="text-xs text-muted-foreground uppercase ml-1">{p.payment_method}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{p.payment_date_bs}{p.note ? ` · ${p.note}` : ""}</div>
                </div>
                <Button variant="ghost" size="icon" className="no-print h-8 w-8 flex-shrink-0"
                  onClick={() => { if (confirm("Delete payment?")) removePay.mutate(p.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs sm:text-sm py-1 gap-2">
      <span className="truncate">{label}</span>
      <span className="font-medium flex-shrink-0">{value}</span>
    </div>
  );
}
