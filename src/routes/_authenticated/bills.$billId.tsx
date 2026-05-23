import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
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
import {
  computeBillTotal,
  computeElectricity,
  computePaid,
  computeRemaining,
  computeStatus,
  fmtNPR,
  type PaymentMethod,
  type BillStatus,
} from "@/lib/calc";
import { Trash2, Share2, ImageDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/hamro-rent-logo.jpeg";

export const Route = createFileRoute("/_authenticated/bills/$billId")({
  head: () => ({ meta: [{ title: "Bill — Rent Manager" }] }),
  component: BillPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusMeta(status: BillStatus) {
  switch (status) {
    case "paid":     return { bg: "#dcfce7", text: "#15803d", label: "PAID" };
    case "overpaid": return { bg: "#dbeafe", text: "#1d4ed8", label: "OVERPAID" };
    case "partial":  return { bg: "#fef9c3", text: "#a16207", label: "PARTIAL" };
    default:         return { bg: "#fee2e2", text: "#b91c1c", label: "PENDING" };
  }
}

/** "Baishakh 2081 for Ram Bahadur" → "Bill of Baishakh-2081 for Ram Bahadur" */
function billFilename(bill: any) {
  const month = bsMonthName(bill.bs_month);
  const year = bill.bs_year;
  const name = (bill.tenants?.name ?? "Tenant").replace(/\s+/g, "_");
  return `Bill_of_${month}-${year}_for_${name}`;
}

// ─── Canvas bill image ────────────────────────────────────────────────────────

async function renderBillToCanvas(bill: any, logoSrc: string): Promise<HTMLCanvasElement> {
  const charges  = bill.additional_charges ?? [];
  const payments = bill.payments ?? [];
  const total     = computeBillTotal(bill, charges);
  const paid      = computePaid(payments);
  const remaining = computeRemaining(bill, charges, payments);
  const status    = computeStatus(bill, charges, payments) as BillStatus;
  const elec      = computeElectricity(bill);
  const rentFor   = nextBSMonth(bill.bs_year, bill.bs_month);
  const sc        = statusMeta(status);

  const W       = 680;
  const PAD     = 40;
  const LINE    = 30;
  const GAP     = 20;
  const DPR     = 2;

  // ── Dynamic height
  const billRows   = 3 + charges.length + (bill.carry_forward_credit > 0 ? 1 : 0);
  const payRows    = payments.length;
  const H =
    100 +                           // header
    GAP + 16 + billRows * LINE +    // bill section
    GAP + LINE + LINE +             // total / paid / remaining
    GAP + 1 +                       // divider
    (payRows > 0 ? GAP + 16 + payRows * LINE : 0) +
    (bill.notes ? GAP + 16 + LINE : 0) +
    GAP + 52;                       // footer

  const canvas = document.createElement("canvas");
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // ── Utilities
  const rr = (x: number, y: number, w: number, h: number, r: number | number[], color: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const txt = (
    str: string, x: number, y: number,
    { size = 13, weight = "400", color = "#1f2937", align = "left" as CanvasTextAlign } = {}
  ) => {
    ctx.font = `${weight} ${size}px ui-sans-serif,system-ui,sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(str, x, y);
    ctx.textAlign = "left";
  };

  const hr = (y: number, color = "#e5e7eb") => {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  };

  const twoCol = (
    label: string, value: string, y: number,
    { bold = false, valueColor = "#111827" } = {}
  ) => {
    txt(label, PAD, y, { weight: bold ? "600" : "400", size: bold ? 14 : 13, color: "#374151" });
    txt(value, W - PAD, y, { weight: bold ? "700" : "600", size: bold ? 14 : 13, color: valueColor, align: "right" });
  };

  // ── White card bg
  rr(0, 0, W, H, 20, "#ffffff");

  // ── Dark header
  rr(0, 0, W, 92, [20, 20, 0, 0], "#0f172a");

  // Logo
  try {
    const img = new Image();
    img.src = logoSrc;
    await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
    ctx.save();
    ctx.beginPath(); ctx.arc(PAD + 24, 46, 24, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, PAD, 22, 48, 48);
    ctx.restore();
  } catch { /* skip */ }

  txt("Hamro Rent",   PAD + 62, 40, { size: 19, weight: "700", color: "#ffffff" });
  txt("Rent Receipt", PAD + 62, 60, { size: 12, color: "#94a3b8" });

  // Month + tenant (header right)
  txt(bsLabel(bill.bs_year, bill.bs_month), W - PAD, 38, { size: 15, weight: "600", color: "#ffffff", align: "right" });
  txt(`${bill.tenants?.name ?? ""}${bill.tenants?.room_number ? " · Room " + bill.tenants.room_number : ""}`,
    W - PAD, 60, { size: 12, color: "#94a3b8", align: "right" });

  // Status badge
  const badgeW = 90;
  const badgeX = W - PAD - badgeW;
  rr(badgeX, 68, badgeW, 22, 6, sc.bg);
  txt(sc.label, badgeX + badgeW / 2, 83, { size: 11, weight: "700", color: sc.text, align: "center" });

  // ── Bill breakdown section
  let y = 100 + GAP;
  txt("Bill breakdown", PAD, y, { size: 12, weight: "600", color: "#6b7280" });
  y += 20;

  twoCol(`Rent for ${bsMonthName(rentFor.month)} ${rentFor.year}`, fmtNPR(bill.rent_this_month), y);
  y += LINE;
  twoCol(`Water — ${bsMonthName(bill.bs_month)}`, fmtNPR(bill.water_bill), y);
  y += LINE;
  twoCol(
    `Electricity — ${bsMonthName(bill.bs_month)} (${bill.electricity_mode === "per_unit" ? "per unit" : "direct"})`,
    fmtNPR(elec), y
  );
  y += LINE;

  for (const c of charges) {
    twoCol(c.label, fmtNPR(c.amount), y);
    y += LINE;
  }
  if (bill.carry_forward_credit > 0) {
    twoCol("Carry-forward credit", `− ${fmtNPR(bill.carry_forward_credit)}`, y, { valueColor: "#16a34a" });
    y += LINE;
  }

  y += 8; hr(y); y += 16;
  twoCol("Total", fmtNPR(total), y, { bold: true });
  y += LINE;
  twoCol("Paid", fmtNPR(paid), y, { valueColor: "#16a34a" });
  y += LINE;
  twoCol(
    "Remaining",
    fmtNPR(remaining),
    y,
    { bold: true, valueColor: remaining > 0 ? "#dc2626" : "#16a34a" }
  );
  y += GAP;

  // Progress bar
  const barW = W - PAD * 2;
  rr(PAD, y, barW, 6, 3, "#f1f5f9");
  const pct = total > 0 ? Math.min(1, paid / total) : 0;
  if (pct > 0) rr(PAD, y, barW * pct, 6, 3, "#22c55e");
  y += 6 + GAP;

  // ── Payments section
  if (payments.length > 0) {
    hr(y); y += GAP;
    txt("Payments", PAD, y, { size: 12, weight: "600", color: "#6b7280" });
    y += 20;
    for (const p of payments) {
      txt(`${p.payment_date_bs}`, PAD, y, { size: 12, color: "#374151" });
      txt(p.payment_method.toUpperCase(), PAD + 120, y, { size: 10, color: "#9ca3af", weight: "600" });
      txt(fmtNPR(p.amount_paid), W - PAD, y, { size: 13, weight: "600", color: "#111827", align: "right" });
      if (p.note) txt(`· ${p.note}`, PAD + 200, y, { size: 11, color: "#9ca3af" });
      y += LINE;
    }
  }

  // ── Notes
  if (bill.notes) {
    hr(y); y += GAP;
    txt("Notes", PAD, y, { size: 12, weight: "600", color: "#6b7280" });
    y += 20;
    txt(bill.notes, PAD, y, { size: 12, color: "#6b7280" });
    y += LINE;
  }

  // ── Footer
  y += GAP;
  hr(y, "#f1f5f9"); y += 18;
  txt("Generated by Hamro Rent · This is an official receipt", W / 2, y, {
    size: 11, color: "#9ca3af", align: "center",
  });
  y += 18;
  txt(new Date().toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" }),
    W / 2, y, { size: 11, color: "#cbd5e1", align: "center" });

  return canvas;
}

// ─── Download helper ──────────────────────────────────────────────────────────

async function downloadBillImage(bill: any, logoSrc: string) {
  const canvas = await renderBillToCanvas(bill, logoSrc);
  const filename = billFilename(bill) + ".png";
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));

  // Mobile native share (share as file)
  if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    try {
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({ files: [file], title: filename });
      return;
    } catch { /* fall through to download */ }
  }

  // Desktop: copy to clipboard if supported
  if (navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Bill image copied to clipboard!");
      return;
    } catch { /* fall through to download */ }
  }

  // Fallback: download file
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded: ${filename}`);
}

async function saveBillImageFile(bill: any, logoSrc: string) {
  const canvas = await renderBillToCanvas(bill, logoSrc);
  const filename = billFilename(bill) + ".png";
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Saved: ${filename}`);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function BillPage() {
  const { billId } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const fn       = useServerFn(getBill);
  const delFn    = useServerFn(deleteBill);
  const payFn    = useServerFn(recordPayment);
  const delPayFn = useServerFn(deletePayment);

  const { data: bill, isLoading } = useQuery({
    queryKey: ["bill", billId],
    queryFn: () => fn({ data: { id: billId } }),
  });

  const [date,   setDate]   = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note,   setNote]   = useState("");
  const [imgBusy, setImgBusy] = useState(false);

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["bill", billId] }); toast.success("Removed"); },
  });

  const removeBill = useMutation({
    mutationFn: () => delFn({ data: { id: billId } }),
    onSuccess: () => { toast.success("Bill deleted"); nav({ to: "/dashboard" }); },
  });

  const handleCopyImage = useCallback(async () => {
    if (!bill) return;
    setImgBusy(true);
    try {
      await downloadBillImage(bill, logo);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate image");
    } finally {
      setImgBusy(false);
    }
  }, [bill]);

  const handleDownloadImage = useCallback(async () => {
    if (!bill) return;
    setImgBusy(true);
    try {
      await saveBillImageFile(bill, logo);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate image");
    } finally {
      setImgBusy(false);
    }
  }, [bill]);

  if (isLoading || !bill) return <p className="text-muted-foreground">Loading…</p>;

  const charges   = bill.additional_charges ?? [];
  const payments  = bill.payments ?? [];
  const total     = computeBillTotal(bill, charges);
  const paid      = computePaid(payments);
  const remaining = computeRemaining(bill, charges, payments);
  const status    = computeStatus(bill, charges, payments) as BillStatus;
  const elec      = computeElectricity(bill);
  const rentForMonth = nextBSMonth(bill.bs_year, bill.bs_month);
  const rentLabel = `Rent for ${bsMonthName(rentForMonth.month)} ${rentForMonth.year}`;
  const collectionPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

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

  const isMobile = /Android|iPhone|iPad|iPod/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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

          {/* Copy / Share image */}
          <Button
            variant="outline"
            size="sm"
            disabled={imgBusy}
            onClick={handleCopyImage}
            title={isMobile ? "Share bill image" : "Copy bill as image"}
            className="text-xs sm:text-sm"
          >
            {imgBusy
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <ImageDown className="h-4 w-4 mr-1" />}
            <span className="hidden sm:inline">{isMobile ? "Share image" : "Copy image"}</span>
            <span className="sm:hidden">Image</span>
          </Button>

          {/* Download PNG */}
          <Button
            variant="outline"
            size="sm"
            disabled={imgBusy}
            onClick={handleDownloadImage}
            title={`Download as ${billFilename(bill)}.png`}
            className="text-xs sm:text-sm"
          >
            {imgBusy
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <ImageDown className="h-4 w-4 mr-1" />}
            <span className="hidden sm:inline">Download PNG</span>
            <span className="sm:hidden">PNG</span>
          </Button>

          {/* Share link */}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const token = bill.share_token ?? bill.shareToken ?? bill.token;
                if (!token) { toast.error("Share token not found"); return; }
                const url = `${window.location.origin}/share/${token}`;
                if (navigator.share && isMobile) {
                  await navigator.share({ title: `Bill — ${bill.tenants?.name}`, url });
                  return;
                }
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(url);
                } else {
                  const ta = document.createElement("textarea");
                  ta.value = url; ta.style.position = "fixed"; ta.style.left = "-9999px";
                  document.body.appendChild(ta); ta.select(); document.execCommand("copy");
                  document.body.removeChild(ta);
                }
                toast.success("Share link copied");
              } catch (e) { toast.error("Failed to copy share link"); }
            }}
            className="text-xs sm:text-sm"
          >
            <Share2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Share link</span>
            <span className="sm:hidden">Share</span>
          </Button>

          <HelpTip text={HELP.shareLink} label="Share" />

          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this bill and all its payments?")) removeBill.mutate(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bill breakdown */}
      <Card className="p-3 sm:p-5">
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-semibold">Bill breakdown</h2>
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
          <span>Paid</span><span className="text-green-600 font-medium">{fmtNPR(paid)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-1.5">Remaining <HelpTip text={HELP.remainingBalance} label="Remaining" /></span>
          <span className={remaining > 0 ? "text-red-500" : "text-green-600"}>{fmtNPR(remaining)}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Collection progress</span>
            <span>{collectionPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${collectionPct}%` }}
            />
          </div>
        </div>

        {bill.notes && <p className="text-xs sm:text-sm text-muted-foreground mt-3 italic">{bill.notes}</p>}
      </Card>

      {/* Record payment */}
      <Card className="p-3 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold mb-3">Record payment</h2>
        <form onSubmit={submitPay} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel help={HELP.paymentDate} required>Date (BS)</FieldLabel>
            <Input placeholder="2081-05-12" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.paymentAmount} required>Amount (NPR)</FieldLabel>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <FieldLabel help={HELP.paymentMethod} required>Method</FieldLabel>
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
          <div>
            <FieldLabel help={HELP.paymentNote}>Note</FieldLabel>
            <Textarea rows={1} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="col-span-full">
            <Button type="submit" disabled={pay.isPending} className="w-full">
              {pay.isPending ? "Saving…" : "Add payment"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Payments list */}
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
                    {fmtNPR(p.amount_paid)}
                    <span className="text-xs text-muted-foreground uppercase ml-1">{p.payment_method}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.payment_date_bs}{p.note ? ` · ${p.note}` : ""}
                  </div>
                </div>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"
                  onClick={() => { if (confirm("Delete payment?")) removePay.mutate(p.id); }}
                >
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
