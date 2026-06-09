import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { landlords: 0, tenants: 0, paymentsNPR: 0 };

  const supabase = createClient(url, key);

  const [
    { count: landlords },
    { count: tenants },
    { data: payments },
  ] = await Promise.all([
    supabase.from("landlord_profiles").select("*", { count: "exact", head: true }),
    supabase.from("tenants").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("payments").select("amount_paid"),
  ]);

  const paymentsNPR = (payments ?? []).reduce(
    (sum: number, p: any) => sum + (Number(p.amount_paid) || 0),
    0
  );

  return { landlords: landlords ?? 0, tenants: tenants ?? 0, paymentsNPR };
});
