import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { bsLabel } from "@/lib/bs-calendar";
import { computeBillTotal, computeElectricity, computePaid, computeRemaining, computeStatus, fmtNPR, type BillStatus } from "@/lib/calc";
import { Printer } from "lucide-react";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/share/$token")({
  head: () => ({ meta: [{ title: "Bill — Hamro Rent" }, { name: "robots", content: "noindex" }] }),
  component: SharedBillPage,
});

function SharedBillPage() {
  const { token } = Route.useParams();
  const { data: bill, isLoading, error } = useQuery({
    queryKey: ["share-bill", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/bill/${token}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Not found");
      return res.json();
    },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading bill…</div>;
  if (error || !bill) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Bill not found or link is invalid.</div>;

  const charges = bill.additional_charges ?? [];
  const payments = bill.payments ?? [];
  const total = computeBillTotal(bill, charges);
  const paid = computePaid(payments);
  const remaining = computeRemaining(bill, charges, payments);
  const status = computeStatus(bill, charges, payments) as BillStatus;
  const elec = computeElectricity(bill);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <div className="font-display text-lg leading-tight">Hamro Rent</div>
              <div className="text-xs text-muted-foreground">Shared bill (read-only)</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1.5" />Print / Save as PDF
          </Button>
        </header>

        <Card className="p-6 space-y-4 print:shadow-none print:border-0">
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <div>
              <div className="text-sm text-muted-foreground">Bill for</div>
              <div className="text-xl font-semibold">{bill.tenants?.name}{bill.tenants?.room_number ? ` · Room ${bill.tenants.room_number}` : ""}</div>
              <div className="text-sm text-muted-foreground mt-1">{bsLabel(bill.bs_year, bill.bs_month)}</div>
            </div>
            <StatusBadge status={status} />
          </div>

          <div>
            <Row label="Rent" value={fmtNPR(bill.rent_this_month)} />
            <Row label="Water" value={fmtNPR(bill.water_bill)} />
            <Row label={`Electricity (${bill.electricity_mode === "per_unit" ? "per unit" : "direct"})`} value={fmtNPR(elec)} />
            {charges.map((c: any) => <Row key={c.id} label={c.label} value={fmtNPR(c.amount)} />)}
            {bill.carry_forward_credit > 0 && <Row label="Carry-forward credit" value={`− ${fmtNPR(bill.carry_forward_credit)}`} />}
            <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span><span>{fmtNPR(total)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1"><span>Paid</span><span>{fmtNPR(paid)}</span></div>
            <div className="flex justify-between text-sm font-medium"><span>Remaining</span><span>{fmtNPR(remaining)}</span></div>
          </div>

          {payments.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-sm font-semibold mb-2">Payments</div>
              {payments.map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm py-1">
                  <span>{p.payment_date_bs} · <span className="uppercase text-xs text-muted-foreground">{p.payment_method}</span></span>
                  <span>{fmtNPR(p.amount_paid)}</span>
                </div>
              ))}
            </div>
          )}

          {bill.notes && <p className="text-sm text-muted-foreground italic border-t pt-3">{bill.notes}</p>}

          {bill.payment_qr_url && (
            <div className="border-t pt-4 flex flex-col items-center gap-2 print:break-inside-avoid">
              <p className="text-sm font-semibold">Payment QR</p>
              <img
                src={bill.payment_qr_url}
                alt="Payment QR"
                className="h-44 w-44 rounded-lg object-contain border bg-white p-2"
              />
              <p className="text-xs text-muted-foreground">Scan to pay</p>
            </div>
          )}
        </Card>

        <p className="text-xs text-center text-muted-foreground no-print">
          Generated by Hamro Rent · This is a read-only view.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm py-1"><span>{label}</span><span>{value}</span></div>;
}
