// Bikram Sambat calendar — month names + day counts per (year, month).
// Day counts cover BS 2080–2090 (covers AD ~2023–2034). Outside this range
// we fall back to a safe upper bound (32) for date validation.

export const BS_MONTHS = [
  "Baisakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
] as const;

export type BSMonth = number; // 1..12

// Day counts per BS month per year. Source: standard BS calendar tables.
const BS_DAYS_IN_MONTH: Record<number, number[]> = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2086: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

export function bsMonthName(month: number): string {
  if (month < 1 || month > 12) return "—";
  return BS_MONTHS[month - 1];
}

export function bsLabel(year: number, month: number): string {
  return `${bsMonthName(month)} ${year}`;
}

export function daysInBSMonth(year: number, month: number): number {
  const arr = BS_DAYS_IN_MONTH[year];
  if (!arr) return 32; // safe upper bound for unknown years
  return arr[month - 1] ?? 32;
}

export function isValidBSDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInBSMonth(year, month);
}

/** Years we render in pickers. */
export function bsYearOptions(): number[] {
  return Object.keys(BS_DAYS_IN_MONTH)
    .map((y) => Number(y))
    .sort((a, b) => a - b);
}

/** Compare two BS (year, month) tuples — numeric, never alphabetical. */
export function compareBSMonth(
  a: { bs_year: number; bs_month: number },
  b: { bs_year: number; bs_month: number },
): number {
  if (a.bs_year !== b.bs_year) return a.bs_year - b.bs_year;
  return a.bs_month - b.bs_month;
}

/**
 * Approximate "current" BS month, used to default pickers.
 * Bikram Sambat is roughly 56y 8m ahead of AD; Baisakh starts mid-April.
 */
export function approxCurrentBS(): { year: number; month: number } {
  const now = new Date();
  const adYear = now.getFullYear();
  const adMonth = now.getMonth() + 1; // 1..12
  // Baisakh ≈ mid-April. Before mid-April → previous BS year.
  const year = adMonth >= 4 ? adYear + 57 : adYear + 56;
  // Rough month mapping: Apr→Baisakh(1), May→Jestha(2), ... Mar→Chaitra(12)
  const mapping = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
  const month = mapping[adMonth - 1];
  return { year, month };
}

export function formatBSDate(s: string | null | undefined): string {
  if (!s) return "—";
  return s;
}
