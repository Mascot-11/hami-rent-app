import jsPDF from "jspdf";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, computeElectricity } from "./calc";
import { bsLabel, bsMonthName, approxCurrentBS } from "./bs-calendar";

// ─── Exact BS day ─────────────────────────────────────────────────────────────
const BS_MONTH_START_DAYS: [number, number, number, number, number][] = [
  [2025,4,14,2082,1],[2025,5,15,2082,2],[2025,6,15,2082,3],[2025,7,16,2082,4],
  [2025,8,17,2082,5],[2025,9,17,2082,6],[2025,10,17,2082,7],[2025,11,16,2082,8],
  [2025,12,15,2082,9],[2026,1,14,2082,10],[2026,2,13,2082,11],[2026,3,14,2082,12],
  [2026,4,13,2083,1],[2026,5,14,2083,2],[2026,6,15,2083,3],[2026,7,16,2083,4],
  [2026,8,16,2083,5],[2026,9,17,2083,6],[2026,10,17,2083,7],[2026,11,16,2083,8],
  [2026,12,15,2083,9],[2027,1,14,2083,10],[2027,2,12,2083,11],[2027,3,13,2083,12],
  [2027,4,13,2084,1],[2027,5,15,2084,2],[2027,6,15,2084,3],[2027,7,16,2084,4],
];

function getTodayBSFull(): { year: number; month: number; day: number } {
  const bs  = approxCurrentBS();
  const now = new Date();
  const adYear = now.getFullYear(), adMonth = now.getMonth() + 1, adDay = now.getDate();
  const entry = BS_MONTH_START_DAYS.find(([,,,y,m]) => y === bs.year && m === bs.month);
  if (!entry) return { ...bs, day: adDay };
  const startDate = new Date(entry[0], entry[1] - 1, entry[2]);
  const today     = new Date(adYear, adMonth - 1, adDay);
  const elapsed   = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
  return { year: bs.year, month: bs.month, day: elapsed + 1 };
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type StatementPeriod = "monthly" | "3months" | "6months" | "yearly";

// ─── Colour palette ───────────────────────────────────────────────────────────
type RGB = readonly [number, number, number];
const C = {
  navy:       [15,  42,  74] as RGB,   // header bg
  navyMid:    [26,  82, 118] as RGB,   // section headings
  navyLight:  [235,243,252] as RGB,    // alternate row / section bg
  red:        [192, 57,  43] as RGB,   // accent
  redLight:   [253,236,234] as RGB,
  dark:       [22,  28,  36] as RGB,   // primary text
  mid:        [75,  85,  99] as RGB,   // secondary text
  muted:      [148,163,184] as RGB,    // muted
  line:       [226,232,240] as RGB,    // divider
  white:      [255,255,255] as RGB,
  green:      [22, 163,  74] as RGB,
  greenLight: [220,252,231] as RGB,
  orange:     [234, 88,  12] as RGB,
  orangeLight:[255,237,213] as RGB,
  tblHead:    [30,  41,  59] as RGB,   // table header bg
} as const;

function setFill(doc: jsPDF, c: RGB)   { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: jsPDF, c: RGB)   { doc.setDrawColor(c[0], c[1], c[2]); }
function setRgb(doc: jsPDF, c: RGB)    { doc.setTextColor(c[0], c[1], c[2]); }

// ─── Period helpers ───────────────────────────────────────────────────────────
export function getPeriodLabel(period: StatementPeriod, bs: { year: number; month: number }): string {
  const { year, month } = bs;
  switch (period) {
    case "monthly":  return `${bsMonthName(month)} ${year} BS`;
    case "3months": { const s = stepBS(year,month,2); return `${bsMonthName(s.month)} ${s.year} – ${bsMonthName(month)} ${year} BS`; }
    case "6months": { const s = stepBS(year,month,5); return `${bsMonthName(s.month)} ${s.year} – ${bsMonthName(month)} ${year} BS`; }
    case "yearly":   return `${year} BS  (Full Year)`;
  }
}

function stepBS(year: number, month: number, back: number): { year: number; month: number } {
  let y = year, m = month;
  for (let i = 0; i < back; i++) { m--; if (m < 1) { m = 12; y--; } }
  return { year: y, month: m };
}

function billInPeriod(bsYear: number, bsMonth: number, period: StatementPeriod, cur: { year: number; month: number }): boolean {
  const inR = (y: number, m: number, f: {year:number;month:number}, t: {year:number;month:number}) =>
    y*100+m >= f.year*100+f.month && y*100+m <= t.year*100+t.month;
  switch (period) {
    case "monthly":  return bsYear === cur.year && bsMonth === cur.month;
    case "3months":  return inR(bsYear,bsMonth, stepBS(cur.year,cur.month,2), cur);
    case "6months":  return inR(bsYear,bsMonth, stepBS(cur.year,cur.month,5), cur);
    case "yearly":   return bsYear === cur.year;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tr(s: string, max: number) { return s.length > max ? s.slice(0, max - 1) + "…" : s; }
function pad2(n: number) { return String(n).padStart(2, "0"); }
function adDateStr(d = new Date()) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export async function generateStatement(
  bills: any[], _tenants: any[],
  period: StatementPeriod,
  landlordName: string,
  landlordAddress?: string,
): Promise<void> {

  const current  = approxCurrentBS();
  const bsFull   = getTodayBSFull();
  const bsDate   = `${bsFull.year}-${pad2(bsFull.month)}-${pad2(bsFull.day)} BS`;
  const adDate   = adDateStr();
  const filtered = bills.filter((b) => billInPeriod(b.bs_year, b.bs_month, period, current));

  // ── Page geometry ──────────────────────────────────────────────────────────
  const PW = 210, PH = 297;
  const ML = 12, MR = 12;
  const CW = PW - ML - MR;           // 186 mm
  const HDR_H = 40;                  // header height
  const BODY_TOP = HDR_H + 2;
  const BODY_BTM = PH - 16;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Logo ───────────────────────────────────────────────────────────────────
  let logo: string | null = null;
  try { logo = await loadImage("/hamrorent-logo.jpeg"); } catch {}

  // ══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════════════════════
  const drawHeader = () => {
    // Navy background
    setFill(doc, C.navy);
    doc.rect(0, 0, PW, HDR_H, "F");

    // Red left accent bar
    setFill(doc, C.red);
    doc.rect(0, 0, 3, HDR_H, "F");

    // Logo
    if (logo) {
      // white circle backdrop
      setFill(doc, C.white);
      doc.circle(ML + 3 + 12, HDR_H / 2, 12, "F");
      doc.addImage(logo, "JPEG", ML + 3 + 1, HDR_H / 2 - 11, 22, 22);
    }

    const textX = logo ? ML + 3 + 28 : ML + 6;

    // App name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    setRgb(doc, C.white);
    doc.text("HAMRO RENT", textX, 16);

    // Tagline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 200, 230);
    doc.text("Landlord's Auto Calculator  ·  hamrorent.app", textX, 23);

    // Right — landlord block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setRgb(doc, C.white);
    doc.text(landlordName || "Landlord", PW - MR, 14, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(160, 200, 230);
    let ry = 21;
    if (landlordAddress) { doc.text(landlordAddress, PW - MR, ry, { align: "right" }); ry += 6; }
    doc.text("www.hamrorent.app", PW - MR, ry, { align: "right" });

    // Bottom accent strip
    setFill(doc, C.red);
    doc.rect(0, HDR_H, PW, 1.2, "F");
  };

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  const drawFooter = (pageNum: number, total: number) => {
    setFill(doc, C.navyLight);
    doc.rect(0, PH - 14, PW, 14, "F");
    setFill(doc, C.red);
    doc.rect(0, PH - 14, PW, 0.8, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setRgb(doc, C.mid);
    doc.text(`Generated: ${bsDate}  |  ${adDate}  ·  Hamro Rent  ·  hamrorent.app`, ML + 3, PH - 5.5);
    doc.setFont("helvetica", "bold");
    doc.text(`Page ${pageNum} / ${total}`, PW - MR, PH - 5.5, { align: "right" });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STATS — 4 cards
  // ══════════════════════════════════════════════════════════════════════════
  function computeStats(bs: any[]) {
    let exp = 0, col = 0, paid = 0, partial = 0, pending = 0;
    bs.forEach((b) => {
      const t = computeBillTotal(b, b.additional_charges ?? []);
      const p = computePaid(b.payments ?? []);
      const s = computeStatus(b, b.additional_charges ?? [], b.payments ?? []);
      exp += t; col += p;
      if (s === "paid" || s === "overpaid") paid++;
      else if (s === "partial") partial++;
      else pending++;
    });
    return { count: bs.length, exp, col, out: Math.max(0, exp - col), paid, partial, pending };
  }

  const drawStats = (y: number, s: ReturnType<typeof computeStats>): number => {
    const cards = [
      { label: "TOTAL BILLS",   value: String(s.count),   sub: `${s.paid} paid · ${s.partial} partial · ${s.pending} pending`, accent: C.navyMid },
      { label: "EXPECTED",      value: fmtNPR(s.exp),     sub: "Total billed this period",    accent: C.navyMid },
      { label: "COLLECTED",     value: fmtNPR(s.col),     sub: "Payments received",            accent: C.green   },
      { label: "OUTSTANDING",   value: fmtNPR(s.out),     sub: s.out > 0 ? "Remaining to collect" : "All clear!",  accent: s.out > 0 ? C.red : C.green },
    ] as const;

    const W = (CW - 3 * 3) / 4;  // card width, 3px gap between 4 cards
    const H = 22;

    cards.forEach((card, i) => {
      const x = ML + i * (W + 3);

      // Card bg
      setFill(doc, C.white);
      doc.roundedRect(x, y, W, H, 1.5, 1.5, "F");
      setDraw(doc, C.line);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, W, H, 1.5, 1.5, "S");

      // Left colour bar
      setFill(doc, card.accent);
      doc.rect(x, y, 2.5, H, "F");

      // Label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setRgb(doc, C.muted);
      doc.text(card.label, x + 5, y + 6);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(i === 0 ? 14 : 10);
      setRgb(doc, card.accent);
      doc.text(card.value, x + 5, y + 14);

      // Sub label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      setRgb(doc, C.muted);
      doc.text(card.sub, x + 5, y + 19.5, { maxWidth: W - 7 });
    });

    // Collection rate bar
    const barY = y + H + 5;
    const rate  = s.exp > 0 ? s.col / s.exp : 0;
    const rateC = rate >= 1 ? C.green : rate >= 0.6 ? C.navyMid : C.red;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setRgb(doc, C.dark);
    doc.text(`Collection Rate`, ML, barY);
    doc.setFont("helvetica", "bold");
    setRgb(doc, rateC);
    doc.text(`${Math.round(rate * 100)}%`, PW - MR, barY, { align: "right" });

    const trackY = barY + 3;
    setFill(doc, C.line);
    doc.roundedRect(ML, trackY, CW, 3, 1, 1, "F");
    if (rate > 0) {
      setFill(doc, rateC);
      doc.roundedRect(ML, trackY, CW * Math.min(rate, 1), 3, 1, 1, "F");
    }

    return trackY + 8;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BILL TABLE
  // Columns: # | Tenant | Month | Rent | Water | Elec | Total | Paid | Remaining | Status
  // ══════════════════════════════════════════════════════════════════════════

  // Column definitions  x is absolute from ML
  const COLS = {
    no:     { x: ML,       w: 7  },
    tenant: { x: ML + 7,   w: 44 },
    month:  { x: ML + 51,  w: 24 },
    rent:   { x: ML + 75,  w: 23 },
    water:  { x: ML + 98,  w: 16 },
    elec:   { x: ML + 114, w: 18 },
    total:  { x: ML + 132, w: 22 },
    paid:   { x: ML + 154, w: 20 },
    remain: { x: ML + 174, w: 18 },
    status: { x: ML + 192, w: 6  },   // just an indicator dot
  };

  const ROW_H = 8;
  const TH_H  = 8;

  const drawBillTableHeader = (y: number): number => {
    setFill(doc, C.tblHead);
    doc.rect(ML, y, CW, TH_H, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setRgb(doc, C.white);

    const headers: [keyof typeof COLS, string, "left"|"right"][] = [
      ["no",     "#",         "left"],
      ["tenant", "TENANT",    "left"],
      ["month",  "MONTH",     "left"],
      ["rent",   "RENT",      "right"],
      ["water",  "WATER",     "right"],
      ["elec",   "ELEC.",     "right"],
      ["total",  "TOTAL",     "right"],
      ["paid",   "PAID",      "right"],
      ["remain", "REMAINING", "right"],
    ];
    headers.forEach(([key, label, align]) => {
      const col = COLS[key];
      const tx  = align === "right" ? col.x + col.w - 1.5 : col.x + 1.5;
      doc.text(label, tx, y + TH_H - 2, { align });
    });
    return y + TH_H;
  };

  const STATUS_DOT: Record<string, RGB> = {
    paid:     C.green,
    partial:  C.orange,
    pending:  C.red,
    overpaid: C.navyMid,
  };
  const STATUS_LABEL: Record<string, string> = {
    paid: "PAID", partial: "PART", pending: "PEND", overpaid: "OVER",
  };

  const drawBillRow = (bill: any, rowIdx: number, y: number): number => {
    const isEven = rowIdx % 2 === 0;

    setFill(doc, isEven ? C.white : C.navyLight);
    doc.rect(ML, y, CW, ROW_H, "F");

    const total  = computeBillTotal(bill, bill.additional_charges ?? []);
    const paid   = computePaid(bill.payments ?? []);
    const remain = total - paid;
    const status = computeStatus(bill, bill.additional_charges ?? [], bill.payments ?? []);
    const elec   = computeElectricity(bill);

    const tenantName = bill.tenants?.name ?? "—";
    const room       = bill.tenants?.room_number ? ` (${bill.tenants.room_number})` : "";
    const fullName   = tenantName + room;

    const my = y + ROW_H - 2.5;

    // Row number
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setRgb(doc, C.muted);
    doc.text(String(rowIdx + 1), COLS.no.x + 1.5, my);

    // Tenant — two lines if needed (name + room separately if long)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setRgb(doc, C.dark);
    doc.text(tr(tenantName, 22), COLS.tenant.x + 1.5, y + 4);
    if (room) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      setRgb(doc, C.mid);
      doc.text(tr(bill.tenants?.room_number ?? "", 20), COLS.tenant.x + 1.5, y + 7.5);
    }

    // Month
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setRgb(doc, C.mid);
    doc.text(bsLabel(bill.bs_year, bill.bs_month), COLS.month.x + 1.5, my);

    // Amounts — right-aligned
    const amounts: [keyof typeof COLS, number | null, RGB][] = [
      ["rent",  bill.rent_this_month, C.dark],
      ["water", bill.water_bill > 0 ? bill.water_bill : null, C.mid],
      ["elec",  elec > 0 ? elec : null, C.mid],
    ];
    amounts.forEach(([key, val, color]) => {
      const col = COLS[key];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setRgb(doc, color);
      doc.text(val != null ? fmtNPR(val) : "—", col.x + col.w - 1.5, my, { align: "right" });
    });

    // Total — bold
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setRgb(doc, C.dark);
    doc.text(fmtNPR(total), COLS.total.x + COLS.total.w - 1.5, my, { align: "right" });

    // Paid
    doc.setFont("helvetica", "normal");
    setRgb(doc, paid > 0 ? C.green : C.muted);
    doc.text(paid > 0 ? fmtNPR(paid) : "—", COLS.paid.x + COLS.paid.w - 1.5, my, { align: "right" });

    // Remaining
    setRgb(doc, remain > 0 ? C.red : C.green);
    doc.text(remain > 0 ? fmtNPR(remain) : "—", COLS.remain.x + COLS.remain.w - 1.5, my, { align: "right" });

    // Status dot + label in last tiny column
    const dotColor = STATUS_DOT[status] ?? C.muted;
    setFill(doc, dotColor);
    doc.circle(COLS.status.x + 3, y + ROW_H / 2, 2, "F");

    // Row divider
    setDraw(doc, C.line);
    doc.setLineWidth(0.15);
    doc.line(ML, y + ROW_H, ML + CW, y + ROW_H);

    return y + ROW_H;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TENANT SUMMARY TABLE
  // ══════════════════════════════════════════════════════════════════════════
  function computeTenantStats(bs: any[]) {
    const map = new Map<string, any>();
    bs.forEach((b) => {
      const id   = b.tenant_id;
      const t    = computeBillTotal(b, b.additional_charges ?? []);
      const p    = computePaid(b.payments ?? []);
      const s    = computeStatus(b, b.additional_charges ?? [], b.payments ?? []);
      if (!map.has(id)) map.set(id, {
        name: b.tenants?.name ?? "—", room: b.tenants?.room_number ?? "",
        bills: 0, exp: 0, col: 0, out: 0, paid: 0, partial: 0, pending: 0,
      });
      const r = map.get(id);
      r.bills++; r.exp += t; r.col += p; r.out += Math.max(0, t - p);
      if (s === "paid" || s === "overpaid") r.paid++;
      else if (s === "partial") r.partial++;
      else r.pending++;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  const TS_COLS = {
    no:    { x: ML,       w: 7  },
    name:  { x: ML + 7,   w: 40 },
    room:  { x: ML + 47,  w: 22 },
    bills: { x: ML + 69,  w: 13 },
    exp:   { x: ML + 82,  w: 28 },
    col:   { x: ML + 110, w: 28 },
    out:   { x: ML + 138, w: 28 },
    rate:  { x: ML + 166, w: 20 },
    bar:   { x: ML + 166, w: 20 },
  };

  const drawTenantSummaryHeader = (y: number): number => {
    setFill(doc, C.tblHead);
    doc.rect(ML, y, CW, TH_H, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setRgb(doc, C.white);
    [
      [TS_COLS.no,    "#",           "left"],
      [TS_COLS.name,  "TENANT",      "left"],
      [TS_COLS.room,  "ROOM",        "left"],
      [TS_COLS.bills, "BILLS",       "right"],
      [TS_COLS.exp,   "EXPECTED",    "right"],
      [TS_COLS.col,   "COLLECTED",   "right"],
      [TS_COLS.out,   "OUTSTANDING", "right"],
      [TS_COLS.rate,  "RATE",        "right"],
    ].forEach(([col, label, align]: any) => {
      const tx = align === "right" ? col.x + col.w - 1.5 : col.x + 1.5;
      doc.text(label, tx, y + TH_H - 2, { align });
    });
    return y + TH_H;
  };

  const drawTenantRow = (ts: any, idx: number, y: number): number => {
    const RH = 9;
    setFill(doc, idx % 2 === 0 ? C.white : C.navyLight);
    doc.rect(ML, y, CW, RH, "F");

    const rate = ts.exp > 0 ? ts.col / ts.exp : 1;
    const rateC = rate >= 1 ? C.green : rate >= 0.6 ? C.orange : C.red;
    const my = y + RH - 2.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    setRgb(doc, C.muted);
    doc.text(String(idx + 1), TS_COLS.no.x + 1.5, my);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setRgb(doc, C.dark);
    doc.text(tr(ts.name, 23), TS_COLS.name.x + 1.5, my);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setRgb(doc, C.mid);
    doc.text(tr(ts.room || "—", 13), TS_COLS.room.x + 1.5, my);
    doc.text(String(ts.bills), TS_COLS.bills.x + TS_COLS.bills.w - 1.5, my, { align: "right" });

    setRgb(doc, C.dark);
    doc.text(fmtNPR(ts.exp), TS_COLS.exp.x + TS_COLS.exp.w - 1.5, my, { align: "right" });
    setRgb(doc, C.green);
    doc.text(fmtNPR(ts.col), TS_COLS.col.x + TS_COLS.col.w - 1.5, my, { align: "right" });
    setRgb(doc, ts.out > 0 ? C.red : C.green);
    doc.text(ts.out > 0 ? fmtNPR(ts.out) : "Cleared", TS_COLS.out.x + TS_COLS.out.w - 1.5, my, { align: "right" });

    // Mini bar + %
    const barW = TS_COLS.bar.w - 10;
    const barX = TS_COLS.bar.x;
    const barY = y + 3;
    setFill(doc, C.line);
    doc.roundedRect(barX, barY, barW, 2.5, 0.8, 0.8, "F");
    if (rate > 0) { setFill(doc, rateC); doc.roundedRect(barX, barY, barW * Math.min(rate, 1), 2.5, 0.8, 0.8, "F"); }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setRgb(doc, rateC);
    doc.text(`${Math.round(rate * 100)}%`, TS_COLS.bar.x + TS_COLS.bar.w - 1.5, my, { align: "right" });

    setDraw(doc, C.line);
    doc.setLineWidth(0.15);
    doc.line(ML, y + RH, ML + CW, y + RH);
    return y + RH;
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BUILD
  // ══════════════════════════════════════════════════════════════════════════
  const stats     = computeStats(filtered);
  const tenantSum = computeTenantStats(filtered);
  const sorted    = [...filtered].sort((a, b) => {
    if (a.bs_year  !== b.bs_year)  return b.bs_year - a.bs_year;
    if (a.bs_month !== b.bs_month) return b.bs_month - a.bs_month;
    return (a.tenants?.name ?? "").localeCompare(b.tenants?.name ?? "");
  });

  let pageNum = 1;
  const pages: number[] = [];   // track page numbers for footer fix

  const newPage = () => {
    drawFooter(pageNum, 99);
    pages.push(pageNum);
    doc.addPage();
    pageNum++;
    drawHeader();
    return BODY_TOP + 2;
  };

  const sectionLabel = (y: number, label: string): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setRgb(doc, C.navyMid);
    // left accent bar
    setFill(doc, C.red);
    doc.rect(ML, y, 2.5, 7, "F");
    doc.text(label, ML + 5, y + 5.5);
    return y + 10;
  };

  // ── Page 1 ──
  drawHeader();
  let y = BODY_TOP + 2;

  // Statement title strip
  setFill(doc, C.navyLight);
  doc.rect(ML, y, CW, 14, "F");
  setFill(doc, C.navyMid);
  doc.rect(ML, y, 3, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  setRgb(doc, C.navy);
  doc.text("RENT COLLECTION STATEMENT", ML + 6, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setRgb(doc, C.mid);
  doc.text(`Period: ${getPeriodLabel(period, current)}`, ML + 6, y + 11.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setRgb(doc, C.mid);
  doc.text(`${bsDate}  |  ${adDate}`, PW - MR, y + 11.5, { align: "right" });
  y += 18;

  // Stats cards
  y = drawStats(y, stats);
  y += 4;

  // Bill Details
  y = sectionLabel(y, "BILL DETAILS");
  y = drawBillTableHeader(y);

  for (let i = 0; i < sorted.length; i++) {
    if (y + ROW_H > BODY_BTM) { y = newPage(); y = drawBillTableHeader(y); }
    y = drawBillRow(sorted[i], i, y);
  }

  // Totals row
  if (y + 9 > BODY_BTM) { y = newPage(); }
  setFill(doc, C.tblHead);
  doc.rect(ML, y, CW, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setRgb(doc, C.white);
  doc.text("TOTALS", ML + 1.5, y + 6);
  doc.text(fmtNPR(stats.exp),  COLS.total.x + COLS.total.w - 1.5,  y + 6, { align: "right" });
  setRgb(doc, [134, 239, 172] as RGB);
  doc.text(fmtNPR(stats.col),  COLS.paid.x   + COLS.paid.w   - 1.5,  y + 6, { align: "right" });
  setRgb(doc, stats.out > 0 ? [252, 165, 165] as RGB : [134, 239, 172] as RGB);
  doc.text(stats.out > 0 ? fmtNPR(stats.out) : "—", COLS.remain.x + COLS.remain.w - 1.5, y + 6, { align: "right" });
  y += 12;

  // Tenant Summary
  if (y + TH_H + tenantSum.length * 9 + 16 > BODY_BTM) { y = newPage(); }
  y = sectionLabel(y, "TENANT SUMMARY");
  y = drawTenantSummaryHeader(y);
  tenantSum.forEach((ts, i) => { y = drawTenantRow(ts, i, y); });

  // Final footer
  drawFooter(pageNum, pageNum);

  // ── Save ──────────────────────────────────────────────────────────────────
  const slug = period === "3months" ? "3m" : period === "6months" ? "6m" : period;
  doc.save(`hamrorent-statement-${slug}-${current.year}-${pad2(current.month)}.pdf`);
}

// ─── Image loader ─────────────────────────────────────────────────────────────
function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = src;
  });
}
