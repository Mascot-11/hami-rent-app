// Pure calculation helpers. Totals are ALWAYS recomputed from components.

export type ElectricityMode = "per_unit" | "direct";
export type PaymentMethod = "cash" | "bank" | "esewa" | "khalti" | "other";
export type BillStatus = "paid" | "partial" | "pending" | "overpaid";

export interface BillCore {
  rent_this_month: number;
  water_bill: number;
  electricity_mode: ElectricityMode;
  electricity_prev_reading: number | null;
  electricity_curr_reading: number | null;
  electricity_rate_snapshot: number | null;
  electricity_service_charge: number;
  electricity_direct_amount: number | null;
  carry_forward_credit: number;
}

export interface AdditionalCharge {
  id: string;
  label: string;
  amount: number;
}

export interface Payment {
  id: string;
  amount_paid: number;
}

export function computeElectricity(bill: BillCore): number {
  if (bill.electricity_mode === "direct") {
    return Number(bill.electricity_direct_amount ?? 0);
  }
  const prev = Number(bill.electricity_prev_reading ?? 0);
  const curr = Number(bill.electricity_curr_reading ?? 0);
  const rate = Number(bill.electricity_rate_snapshot ?? 0);
  const svc = Number(bill.electricity_service_charge ?? 0);
  const units = Math.max(0, curr - prev);
  return units * rate + svc;
}

export function computeElectricityUnits(bill: BillCore): number {
  if (bill.electricity_mode !== "per_unit") return 0;
  const prev = Number(bill.electricity_prev_reading ?? 0);
  const curr = Number(bill.electricity_curr_reading ?? 0);
  return Math.max(0, curr - prev);
}

export function computeChargesTotal(charges: AdditionalCharge[]): number {
  return charges.reduce((sum, c) => sum + Number(c.amount || 0), 0);
}

export function computeBillTotal(bill: BillCore, charges: AdditionalCharge[]): number {
  return (
    Number(bill.rent_this_month || 0) +
    Number(bill.water_bill || 0) +
    computeElectricity(bill) +
    computeChargesTotal(charges) -
    Number(bill.carry_forward_credit || 0)
  );
}

export function computePaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
}

export function computeRemaining(
  bill: BillCore,
  charges: AdditionalCharge[],
  payments: Payment[],
): number {
  return computeBillTotal(bill, charges) - computePaid(payments);
}

export function computeStatus(
  bill: BillCore,
  charges: AdditionalCharge[],
  payments: Payment[],
): BillStatus {
  const total = computeBillTotal(bill, charges);
  const paid = computePaid(payments);
  if (paid === 0 && total > 0) return "pending";
  if (paid >= total && paid > total) return "overpaid";
  if (paid >= total) return "paid";
  return "partial";
}

export function fmtNPR(n: number): string {
  if (!isFinite(n)) return "NPR 0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n * 100) / 100);
  return `${sign}NPR ${abs.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const STATUS_LABELS: Record<BillStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  pending: "Pending",
  overpaid: "Overpaid",
};
