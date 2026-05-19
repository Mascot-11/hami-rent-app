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
import { bsLabel } from "@/lib/bs-calendar";
import { computeBillTotal, computeElectricity, computePaid, computeRemaining, computeStatus, fmtNPR, type PaymentMethod, type BillStatus } from "@/lib/calc";
import { Trash2, Printer } from "lucide-react";
import { toast } from "sonner";

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

  const { data: bill, isLoading } = useQuery({ queryKey: ["bill", billId], queryFn: () => fn({ data: { id: billId } }) });

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  const pay = useMutation({
    mutationFn: () => payFn({ data: { bill_id: billId, payment_date_bs: date, amount_paid: Number(amount), payment_method: method, note: note || null } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bill", billId] }); setAmount(""); setNote(""); setDate(""); toast.success("Payment recorded"); },
    onError: (e: any) => toast.error(e.message),
  });
  const removePay = useMutation({
    mutationFn: (id: string) => delPayFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bill", billId] }); toast.success("Removed"); },
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
      <div className="flex items-start justify-between gap-3 no-print">
        <div>
          <Link to="/tenants/$tenantId" params={{ tenantId: bill.tenant_id }} className="text-sm text-primary underline">← {bill.tenants?.name}</Link>
          <h1 className="text-3xl font-display mt-1">{bsLabel(bill.bs_year, bill.bs_month)}</h1>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={status} />
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Print</Button>
          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this bill and all its payments?")) removeBill.mutate(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Bill breakdown</h2>
        <Row label="Rent" value={fmtNPR(bill.rent_this_month)} />
        <Row label="Water" value={fmtNPR(bill.water_bill)} />
        <Row label={`Electricity (${bill.electricity_mode === "per_unit" ? "per unit" : "direct"})`} value={fmtNPR(elec)} />
        {charges.map((c: any) => <Row key={c.id} label={c.label} value={fmtNPR(c.amount)} />)}
        {bill.carry_forward_credit > 0 && <Row label="Carry-forward credit" value={`− ${fmtNPR(bill.carry_forward_credit)}`} />}
        <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-lg">
          <span className="flex items-center gap-1.5">Total <HelpTip text={HELP.billTotal} label="Total" /></span>
          <span>{fmtNPR(total)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span>Paid</span><span>{fmtNPR(paid)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span className="flex items-center gap-1.5">Remaining <HelpTip text={HELP.remainingBalance} label="Remaining" /></span>
          <span>{fmtNPR(remaining)}</span>
        </div>
        {bill.notes && <p className="text-sm text-muted-foreground mt-3 italic">{bill.notes}</p>}
      </Card>

      <Card className="p-5 no-print">
        <h2 className="font-semibold mb-3">Record payment</h2>
        <form onSubmit={submitPay} className="grid grid-cols-2 gap-3">
          <div><FieldLabel help={HELP.paymentDate} required>Date (BS)</FieldLabel><Input placeholder="2081-05-12" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><FieldLabel help={HELP.paymentAmount} required>Amount (NPR)</FieldLabel><Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
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
          <div><FieldLabel help={HELP.paymentNote}>Note</FieldLabel><Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="col-span-2"><Button type="submit" disabled={pay.isPending}>{pay.isPending ? "Saving…" : "Add payment"}</Button></div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Payments ({payments.length})</h2>
        {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments yet.</p> : (
          <div className="space-y-2">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <div className="font-medium">{fmtNPR(p.amount_paid)} <span className="text-xs text-muted-foreground uppercase ml-1">{p.payment_method}</span></div>
                  <div className="text-sm text-muted-foreground">{p.payment_date_bs} {p.note ? `· ${p.note}` : ""}</div>
                </div>
                <Button variant="ghost" size="sm" className="no-print" onClick={() => { if (confirm("Delete payment?")) removePay.mutate(p.id); }}>
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
  return <div className="flex justify-between text-sm py-1"><span>{label}</span><span>{value}</span></div>;
}
