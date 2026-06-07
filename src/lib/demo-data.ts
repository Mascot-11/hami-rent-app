/**
 * Demo mode — all data stored in localStorage, auto-expires after 3 days.
 * Key: "hamro_rent_demo"
 */

export const DEMO_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const STORE_KEY = "hamro_rent_demo";

export interface DemoTenant {
  id: string;
  name: string;
  room_number: string | null;
  phone: string | null;
  move_in_date_bs: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DemoPayment {
  id: string;
  amount_paid: number;
  paid_at: string;
  method: string;
  note: string | null;
}

export interface DemoAdditionalCharge {
  id: string;
  label: string;
  amount: number;
}

export interface DemoBill {
  id: string;
  tenant_id: string;
  bs_year: number;
  bs_month: number;
  rent_this_month: number;
  water_bill: number;
  electricity_mode: "direct" | "per_unit";
  electricity_prev_reading: number | null;
  electricity_curr_reading: number | null;
  electricity_rate_snapshot: number | null;
  electricity_service_charge: number;
  electricity_direct_amount: number | null;
  carry_forward_credit: number;
  notes: string | null;
  created_at: string;
  additional_charges: DemoAdditionalCharge[];
  payments: DemoPayment[];
}

export interface DemoStore {
  createdAt: number;
  tenants: DemoTenant[];
  bills: DemoBill[];
}

const SEED_TENANTS: DemoTenant[] = [
  { id: "demo-t1", name: "Ramesh Sharma", room_number: "101", phone: "9841000001", move_in_date_bs: "2081-01-15", notes: "Quiet tenant, pays on time", is_active: true, created_at: new Date().toISOString() },
  { id: "demo-t2", name: "Sunita Rai", room_number: "102", phone: "9841000002", move_in_date_bs: "2080-07-01", notes: "", is_active: true, created_at: new Date().toISOString() },
  { id: "demo-t3", name: "Bikash Thapa", room_number: "201", phone: null, move_in_date_bs: "2081-03-20", notes: "2 family members", is_active: true, created_at: new Date().toISOString() },
  { id: "demo-t4", name: "Kopila Gurung", room_number: "202", phone: "9841000004", move_in_date_bs: "2079-11-05", notes: "", is_active: false, created_at: new Date().toISOString() },
];

const SEED_BILLS: DemoBill[] = [
  {
    id: "demo-b1", tenant_id: "demo-t1", bs_year: 2082, bs_month: 2,
    rent_this_month: 12000, water_bill: 300, electricity_mode: "per_unit",
    electricity_prev_reading: 1200, electricity_curr_reading: 1340, electricity_rate_snapshot: 12,
    electricity_service_charge: 50, electricity_direct_amount: null, carry_forward_credit: 0, notes: null,
    created_at: new Date().toISOString(),
    additional_charges: [],
    payments: [{ id: "demo-p1", amount_paid: 14030, paid_at: new Date().toISOString(), method: "cash", note: null }],
  },
  {
    id: "demo-b2", tenant_id: "demo-t2", bs_year: 2082, bs_month: 2,
    rent_this_month: 10000, water_bill: 300, electricity_mode: "direct",
    electricity_prev_reading: null, electricity_curr_reading: null, electricity_rate_snapshot: null,
    electricity_service_charge: 0, electricity_direct_amount: 1800, carry_forward_credit: 0, notes: null,
    created_at: new Date().toISOString(),
    additional_charges: [{ id: "demo-ac1", label: "Parking", amount: 500 }],
    payments: [{ id: "demo-p2", amount_paid: 8000, paid_at: new Date().toISOString(), method: "esewa", note: "Partial" }],
  },
  {
    id: "demo-b3", tenant_id: "demo-t3", bs_year: 2082, bs_month: 2,
    rent_this_month: 15000, water_bill: 500, electricity_mode: "per_unit",
    electricity_prev_reading: 800, electricity_curr_reading: 980, electricity_rate_snapshot: 13,
    electricity_service_charge: 75, electricity_direct_amount: null, carry_forward_credit: 500, notes: "Discount applied",
    created_at: new Date().toISOString(),
    additional_charges: [],
    payments: [],
  },
];

function isExpired(store: DemoStore): boolean {
  return Date.now() - store.createdAt > DEMO_TTL_MS;
}

export function getDemoStore(): DemoStore | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const store: DemoStore = JSON.parse(raw);
    if (isExpired(store)) {
      localStorage.removeItem(STORE_KEY);
      return null;
    }
    return store;
  } catch {
    return null;
  }
}

export function initDemoStore(): DemoStore {
  const existing = getDemoStore();
  if (existing) return existing;
  const store: DemoStore = {
    createdAt: Date.now(),
    tenants: SEED_TENANTS,
    bills: SEED_BILLS,
  };
  saveDemoStore(store);
  return store;
}

export function saveDemoStore(store: DemoStore): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function clearDemoStore(): void {
  localStorage.removeItem(STORE_KEY);
}

export function isDemoActive(): boolean {
  return getDemoStore() !== null;
}

export function getDemoTTLRemaining(): string {
  const store = getDemoStore();
  if (!store) return "expired";
  const remaining = DEMO_TTL_MS - (Date.now() - store.createdAt);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}
