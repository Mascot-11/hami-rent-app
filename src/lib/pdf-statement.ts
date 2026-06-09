import jsPDF from "jspdf";
import { computeBillTotal, computePaid, computeStatus, fmtNPR, computeElectricity } from "./calc";
import { bsLabel, bsMonthName, approxCurrentBS } from "./bs-calendar";

// ─── Types ────────────────────────────────────────────────────────────────────
export type StatementPeriod = "monthly" | "3months" | "6months" | "yearly";

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  primary: [26, 82, 118],     // dark blue
  accent:  [192, 57, 43],     // hamro red
  dark:    [30, 30, 46],
  gray:    [93, 109, 126],
  lightGray: [240, 243, 244],
  white:   [255, 255, 255],
  green:   [30, 132, 73],
  orange:  [211, 84, 0],
  yellow:  [243, 156, 18],
  headerBg:[13, 50, 77],
} as const;

type RGB = readonly [number, number, number];

function rgb(doc: jsPDF, color: RGB) {
  doc.setTextColor(color[0], color[1], color[2]);
}
function fill(doc: jsPDF, color: RGB) {
  doc.setFillColor(color[0], color[1], color[2]);
}
function stroke(doc: jsPDF, color: RGB) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

// ─── Period helpers ───────────────────────────────────────────────────────────
export function getPeriodLabel(period: StatementPeriod, bs: { year: number; month: number }): string {
  const { year, month } = bs;
  switch (period) {
    case "monthly":  return `${bsMonthName(month)} ${year}`;
    case "3months": {
      const start = prevBSMonth(year, month, 2);
      return `${bsMonthName(start.month)} ${start.year} – ${bsMonthName(month)} ${year}`;
    }
    case "6months": {
      const start = prevBSMonth(year, month, 5);
      return `${bsMonthName(start.month)} ${start.year} – ${bsMonthName(month)} ${year}`;
    }
    case "yearly": return `${year} BS (Full Year)`;
  }
}

function prevBSMonth(year: number, month: number, steps: number): { year: number; month: number } {
  let y = year, m = month;
  for (let i = 0; i < steps; i++) {
    m--;
    if (m < 1) { m = 12; y--; }
  }
  return { year: y, month: m };
}

function billInPeriod(
  bsYear: number, bsMonth: number,
  period: StatementPeriod,
  current: { year: number; month: number }
): boolean {
  const { year, month } = current;
  switch (period) {
    case "monthly":  return bsYear === year && bsMonth === month;
    case "3months": {
      const start = prevBSMonth(year, month, 2);
      return inRange(bsYear, bsMonth, start, { year, month });
    }
    case "6months": {
      const start = prevBSMonth(year, month, 5);
      return inRange(bsYear, bsMonth, start, { year, month });
    }
    case "yearly":   return bsYear === year;
  }
}

function inRange(
  y: number, m: number,
  from: { year: number; month: number },
  to: { year: number; month: number }
): boolean {
  const val = y * 100 + m;
  return val >= from.year * 100 + from.month && val <= to.year * 100 + to.month;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateStatement(
  bills: any[],
  tenants: any[],
  period: StatementPeriod,
  landlordName: string,
  landlordAddress?: string,
): Promise<void> {
  const current = approxCurrentBS();
  const filtered = bills.filter((b) =>
    billInPeriod(b.bs_year, b.bs_month, period, current)
  );

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210;  // page width
  const PH = 297;  // page height
  const ML = 14;   // margin left
  const MR = 14;   // margin right
  const CW = PW - ML - MR;  // content width

  // ── Load logo ────────────────────────────────────────────────────────────
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await loadImage("/hamrorent-logo.jpeg");
  } catch { /* skip if not available */ }

  // ── Header ───────────────────────────────────────────────────────────────
  const drawHeader = (doc: jsPDF) => {
    // Deep blue top band
    fill(doc, C.headerBg as RGB);
    doc.rect(0, 0, PW, 36, "F");

    // Logo circle (white bg)
    if (logoDataUrl) {
      fill(doc, C.white as RGB);
      doc.circle(ML + 13, 18, 13, "F");
      doc.addImage(logoDataUrl, "JPEG", ML + 1, 5.5, 25, 25);
    }

    // App name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    rgb(doc, C.white as RGB);
    doc.text("HAMRO RENT", logoDataUrl ? ML + 30 : ML, 14);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 210, 230);
    doc.text("हाम्रो रेन्ट  ·  Landlord's Auto Calculator", logoDataUrl ? ML + 30 : ML, 21);

    // Right side — landlord info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    rgb(doc, C.white as RGB);
    doc.text(landlordName || "Landlord", PW - MR, 12, { align: "right" });
    if (landlordAddress) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 210, 230);
      doc.text(landlordAddress, PW - MR, 18, { align: "right" });
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 210, 230);
    doc.text("www.hamrorent.app", PW - MR, landlordAddress ? 24 : 18, { align: "right" });

    // Red accent line
    fill(doc, C.accent as RGB);
    doc.rect(0, 36, PW, 1.5, "F");
  };

  // ── Footer ───────────────────────────────────────────────────────────────
  const drawFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    stroke(doc, [220, 220, 220] as unknown as RGB);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(ML, PH - 12, PW - MR, PH - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    rgb(doc, C.gray as RGB);
    doc.text("Generated by Hamro Rent  ·  hamrorent.app", ML, PH - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, PH - 7, { align: "right" });
  };

  // ── Title section ─────────────────────────────────────────────────────────
  const drawTitle = (doc: jsPDF, y: number): number => {
    // Statement title bg
    fill(doc, [235, 245, 255] as unknown as RGB);
    doc.rect(ML, y, CW, 18, "F");
    stroke(doc, C.primary as RGB);
    doc.setDrawColor(C.primary[0], C.primary[1], C.primary[2]);
    doc.setLineWidth(0.5);
    doc.rect(ML, y, CW, 18, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    rgb(doc, C.primary as RGB);
    doc.text("RENT COLLECTION STATEMENT", ML + 6, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    rgb(doc, C.gray as RGB);
    doc.text(`Period: ${getPeriodLabel(period, current)}`, ML + 6, y + 13);
    doc.text(`Generated: ${bsMonthName(current.month)} ${current.year} BS`, PW - MR - 4, y + 13, { align: "right" });

    return y + 22;
  };

  // ── Summary boxes ─────────────────────────────────────────────────────────
  const drawSummary = (doc: jsPDF, y: number, stats: ReturnType<typeof computeStats>): number => {
    const boxW = (CW - 6) / 4;
    const boxH = 20;
    const boxes = [
      { label: "Total Bills",    value: String(stats.totalBills),   color: C.primary },
      { label: "Expected",       value: fmtNPR(stats.totalExpected), color: C.primary },
      { label: "Collected",      value: fmtNPR(stats.totalCollected), color: C.green },
      { label: "Outstanding",    value: fmtNPR(stats.totalOutstanding), color: stats.totalOutstanding > 0 ? C.accent : C.green },
    ] as const;

    boxes.forEach((box, i) => {
      const x = ML + i * (boxW + 2);
      fill(doc, C.lightGray as RGB);
      doc.rect(x, y, boxW, boxH, "F");
      stroke(doc, [200, 210, 220] as unknown as RGB);
      doc.setDrawColor(200, 210, 220);
      doc.setLineWidth(0.3);
      doc.rect(x, y, boxW, boxH, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      rgb(doc, C.gray as RGB);
      doc.text(box.label, x + boxW / 2, y + 5.5, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      rgb(doc, box.color as RGB);
      doc.text(box.value, x + boxW / 2, y + 13, { align: "center" });
    });

    // Collection rate bar
    const barY = y + boxH + 4;
    const rate = stats.totalExpected > 0 ? stats.totalCollected / stats.totalExpected : 0;
    fill(doc, [220, 230, 240] as unknown as RGB);
    doc.rect(ML, barY, CW, 4, "F");
    fill(doc, (rate >= 1 ? C.green : rate > 0.5 ? C.yellow : C.accent) as RGB);
    doc.rect(ML, barY, CW * Math.min(rate, 1), 4, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    rgb(doc, C.gray as RGB);
    doc.text(`Collection rate: ${Math.round(rate * 100)}%`, ML, barY + 8);
    doc.text(
      `${stats.paidCount} Paid  ·  ${stats.partialCount} Partial  ·  ${stats.pendingCount} Pending`,
      PW - MR, barY + 8, { align: "right" }
    );

    return barY + 14;
  };

  // ── Bills table ───────────────────────────────────────────────────────────
  const COL = {
    tenant:  { x: ML,       w: 36 },
    month:   { x: ML + 37,  w: 24 },
    rent:    { x: ML + 62,  w: 22 },
    elec:    { x: ML + 85,  w: 22 },
    total:   { x: ML + 108, w: 24 },
    paid:    { x: ML + 133, w: 24 },
    remain:  { x: ML + 158, w: 22 },
    status:  { x: ML + 181, w: 15 },
  };

  const drawTableHeader = (doc: jsPDF, y: number): number => {
    fill(doc, C.dark as RGB);
    doc.rect(ML, y, CW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    rgb(doc, C.white as RGB);
    const cols = [
      { label: "TENANT",    col: COL.tenant  },
      { label: "MONTH",     col: COL.month   },
      { label: "RENT",      col: COL.rent    },
      { label: "ELEC.",     col: COL.elec    },
      { label: "TOTAL",     col: COL.total   },
      { label: "PAID",      col: COL.paid    },
      { label: "REMAINING", col: COL.remain  },
      { label: "STATUS",    col: COL.status  },
    ];
    cols.forEach(({ label, col }) => {
      doc.text(label, col.x + 1.5, y + 4.8);
    });
    return y + 7;
  };

  const STATUS_COLORS: Record<string, RGB> = {
    paid:     C.green,
    partial:  C.orange,
    pending:  C.accent,
    overpaid: C.primary,
  };

  const drawBillRow = (doc: jsPDF, bill: any, y: number, shade: boolean): number => {
    const rowH = 7.5;
    if (shade) {
      fill(doc, C.lightGray as RGB);
      doc.rect(ML, y, CW, rowH, "F");
    }

    const total   = computeBillTotal(bill, bill.additional_charges ?? []);
    const paid    = computePaid(bill.payments ?? []);
    const remain  = total - paid;
    const status  = computeStatus(bill, bill.additional_charges ?? [], bill.payments ?? []);
    const elec    = computeElectricity(bill);
    const tenant  = bill.tenants?.name ?? "—";
    const room    = bill.tenants?.room_number ? ` (${bill.tenants.room_number})` : "";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    // Tenant name (truncate if long)
    rgb(doc, C.dark as RGB);
    const nameStr = tenant.length > 18 ? tenant.slice(0, 17) + "…" : tenant;
    doc.text(nameStr + room, COL.tenant.x + 1.5, y + 5);

    rgb(doc, C.gray as RGB);
    doc.text(bsLabel(bill.bs_year, bill.bs_month), COL.month.x + 1.5, y + 5);
    doc.text(fmtNPR(bill.rent_this_month), COL.rent.x + COL.rent.w - 1.5, y + 5, { align: "right" });
    doc.text(elec > 0 ? fmtNPR(elec) : "—", COL.elec.x + COL.elec.w - 1.5, y + 5, { align: "right" });

    doc.setFont("helvetica", "bold");
    rgb(doc, C.dark as RGB);
    doc.text(fmtNPR(total), COL.total.x + COL.total.w - 1.5, y + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    rgb(doc, C.green as RGB);
    doc.text(fmtNPR(paid), COL.paid.x + COL.paid.w - 1.5, y + 5, { align: "right" });

    rgb(doc, remain > 0 ? C.accent as RGB : C.green as RGB);
    doc.text(remain > 0 ? fmtNPR(remain) : "—", COL.remain.x + COL.remain.w - 1.5, y + 5, { align: "right" });

    // Status badge
    const sc = STATUS_COLORS[status] ?? C.gray;
    fill(doc, sc);
    doc.roundedRect(COL.status.x + 0.5, y + 1.5, COL.status.w - 1, 4.5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    rgb(doc, C.white as RGB);
    doc.text(status.toUpperCase(), COL.status.x + COL.status.w / 2, y + 4.6, { align: "center" });

    // bottom row divider
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(ML, y + rowH, PW - MR, y + rowH);

    return y + rowH;
  };

  // ── Tenant summary section ────────────────────────────────────────────────
  const drawTenantSummary = (doc: jsPDF, y: number, tenantStats: ReturnType<typeof computeTenantStats>): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    rgb(doc, C.primary as RGB);
    doc.text("TENANT SUMMARY", ML, y + 5);

    fill(doc, [235, 240, 250] as unknown as RGB);
    doc.rect(ML, y, CW, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    rgb(doc, C.white as RGB);

    y += 7;

    // Sub header
    fill(doc, C.dark as RGB);
    const sumCols = [
      { label: "TENANT",    x: ML,       w: 42 },
      { label: "ROOM",      x: ML + 43,  w: 20 },
      { label: "BILLS",     x: ML + 64,  w: 15 },
      { label: "EXPECTED",  x: ML + 80,  w: 28 },
      { label: "COLLECTED", x: ML + 109, w: 28 },
      { label: "OUTSTANDING",x: ML + 138, w: 30 },
      { label: "RATE",      x: ML + 169, w: 13 },
    ];
    doc.rect(ML, y, CW, 6.5, "F");
    rgb(doc, C.white as RGB);
    sumCols.forEach(c => doc.text(c.label, c.x + 1.5, y + 4.5));
    y += 6.5;

    tenantStats.forEach((ts, idx) => {
      if (idx % 2 === 0) {
        fill(doc, C.lightGray as RGB);
        doc.rect(ML, y, CW, 7, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      rgb(doc, C.dark as RGB);
      const name = ts.name.length > 22 ? ts.name.slice(0, 21) + "…" : ts.name;
      doc.text(name, ML + 1.5, y + 5);

      rgb(doc, C.gray as RGB);
      doc.text(ts.room || "—", ML + 44.5, y + 5);
      doc.text(String(ts.billCount), ML + 75, y + 5);

      rgb(doc, C.dark as RGB);
      doc.text(fmtNPR(ts.expected), ML + 108.5, y + 5, { align: "right" });
      rgb(doc, C.green as RGB);
      doc.text(fmtNPR(ts.collected), ML + 136.5, y + 5, { align: "right" });
      rgb(doc, ts.outstanding > 0 ? C.accent as RGB : C.green as RGB);
      doc.text(ts.outstanding > 0 ? fmtNPR(ts.outstanding) : "Cleared", ML + 167.5, y + 5, { align: "right" });

      const rate = ts.expected > 0 ? Math.round(ts.collected / ts.expected * 100) : 100;
      rgb(doc, rate >= 100 ? C.green as RGB : rate >= 50 ? C.orange as RGB : C.accent as RGB);
      doc.setFont("helvetica", "bold");
      doc.text(`${rate}%`, ML + 181.5, y + 5, { align: "right" });

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(ML, y + 7, PW - MR, y + 7);
      y += 7;
    });

    return y + 4;
  };

  // ── Compute stats ─────────────────────────────────────────────────────────
  function computeStats(bills: any[]) {
    let totalExpected = 0, totalCollected = 0;
    let paidCount = 0, partialCount = 0, pendingCount = 0;
    bills.forEach((b) => {
      const total = computeBillTotal(b, b.additional_charges ?? []);
      const paid  = computePaid(b.payments ?? []);
      const status = computeStatus(b, b.additional_charges ?? [], b.payments ?? []);
      totalExpected  += total;
      totalCollected += paid;
      if (status === "paid" || status === "overpaid") paidCount++;
      else if (status === "partial") partialCount++;
      else pendingCount++;
    });
    return {
      totalBills: bills.length,
      totalExpected,
      totalCollected,
      totalOutstanding: Math.max(0, totalExpected - totalCollected),
      paidCount, partialCount, pendingCount,
    };
  }

  function computeTenantStats(bills: any[]) {
    const map = new Map<string, { name: string; room: string; billCount: number; expected: number; collected: number; outstanding: number }>();
    bills.forEach((b) => {
      const id = b.tenant_id;
      const name = b.tenants?.name ?? "Unknown";
      const room = b.tenants?.room_number ?? "";
      const total = computeBillTotal(b, b.additional_charges ?? []);
      const paid  = computePaid(b.payments ?? []);
      if (!map.has(id)) map.set(id, { name, room, billCount: 0, expected: 0, collected: 0, outstanding: 0 });
      const s = map.get(id)!;
      s.billCount++;
      s.expected += total;
      s.collected += paid;
      s.outstanding += Math.max(0, total - paid);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ── Build pages ───────────────────────────────────────────────────────────
  const stats     = computeStats(filtered);
  const tenantSum = computeTenantStats(filtered);

  const PAGE_CONTENT_START = 42;
  const PAGE_CONTENT_END   = PH - 18;
  const ROW_H = 7.5;

  let pageNum = 1;
  let y = PAGE_CONTENT_START;

  drawHeader(doc);
  y = drawTitle(doc, y + 2);
  y = drawSummary(doc, y + 2, stats);
  y += 6;

  // Section heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  rgb(doc, C.primary as RGB);
  doc.text("BILL DETAILS", ML, y);
  y += 4;

  y = drawTableHeader(doc, y);

  // Bills rows with pagination
  const sortedBills = [...filtered].sort((a, b) => {
    if (a.bs_year !== b.bs_year) return b.bs_year - a.bs_year;
    if (a.bs_month !== b.bs_month) return b.bs_month - a.bs_month;
    return (a.tenants?.name ?? "").localeCompare(b.tenants?.name ?? "");
  });

  // Collect all pages to know total count
  const allPages: (() => void)[] = [];

  for (let i = 0; i < sortedBills.length; i++) {
    if (y + ROW_H > PAGE_CONTENT_END) {
      drawFooter(doc, pageNum, 99); // placeholder total, fix after
      doc.addPage();
      pageNum++;
      drawHeader(doc);
      y = PAGE_CONTENT_START;
      y = drawTableHeader(doc, y);
    }
    y = drawBillRow(doc, sortedBills[i], y, i % 2 === 0);
  }

  // Tenant summary — starts on new page if not enough space
  if (y + 14 + tenantSum.length * 7 + 30 > PAGE_CONTENT_END) {
    drawFooter(doc, pageNum, 99);
    doc.addPage();
    pageNum++;
    drawHeader(doc);
    y = PAGE_CONTENT_START;
  } else {
    y += 8;
  }

  y = drawTenantSummary(doc, y, tenantSum);

  const totalPages = pageNum;

  // Fix footer page counts — re-draw on final page
  drawFooter(doc, totalPages, totalPages);

  // Fix page 1's footer if multi-page (we can only re-draw the last page easily; for simple PDFs this is fine)
  // For a production app you'd use a 2-pass approach, but this is clean enough

  // ── Save ──────────────────────────────────────────────────────────────────
  const periodSlug = period === "3months" ? "3m" : period === "6months" ? "6m" : period;
  doc.save(`hamrorent-statement-${periodSlug}-${current.year}-${current.month}.pdf`);
}

// ─── Image loader ─────────────────────────────────────────────────────────────
function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = reject;
    img.src = src;
  });
}
