import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/**
 * SECURITY: This function has NO auth middleware — it is called from the
 * public landing page. It must NEVER query private tables (tenants, bills,
 * payments, landlord_profiles). It only reads from a dedicated
 * `public_platform_stats` table that is updated by a Supabase scheduled
 * function or trigger — a table that contains only aggregate counts with
 * NO personal data.
 *
 * If that table doesn't exist yet, we return safe zeros.
 */
export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return { landlords: 0, tenants: 0, paymentsNPR: 0 };

    const supabase = createClient(url, key);

    // ONLY read from a safe aggregate table — never from private data tables.
    const { data, error } = await supabase
      .from("public_platform_stats")
      .select("landlord_count, tenant_count, total_payments_npr")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return { landlords: 0, tenants: 0, paymentsNPR: 0 };

    return {
      landlords: Number(data.landlord_count) || 0,
      tenants: Number(data.tenant_count) || 0,
      paymentsNPR: Number(data.total_payments_npr) || 0,
    };
  } catch {
    // Never surface internal errors to the public
    return { landlords: 0, tenants: 0, paymentsNPR: 0 };
  }
});
