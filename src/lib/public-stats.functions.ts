import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/**
 * SECURITY: No auth middleware — called from the public landing page.
 *
 * Reads ONLY from public_platform_stats — a dedicated aggregate table
 * containing only counts. No personal data, no direct queries to
 * tenants / bills / payments.
 *
 * Uses the SERVICE ROLE key so it can read the stats table regardless
 * of RLS config, but is strictly limited to that one table.
 */
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) return { landlords: 0, tenants: 0, paymentsNPR: 0 };

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase
      .from("public_platform_stats")
      .select("landlord_count, tenant_count, total_payments_npr")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return { landlords: 0, tenants: 0, paymentsNPR: 0 };

    return {
      landlords: Number(data.landlord_count) || 0,
      tenants:   Number(data.tenant_count)   || 0,
      paymentsNPR: Number(data.total_payments_npr) || 0,
    };
  } catch {
    return { landlords: 0, tenants: 0, paymentsNPR: 0 };
  }
});
