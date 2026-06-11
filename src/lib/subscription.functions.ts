/**
 * subscription.functions.ts
 *
 * User-facing subscription reads + public (sanitized) ads config.
 *
 * Security model:
 * - getMySubscription: authenticated, RLS-scoped user client (select own row only).
 * - getAdsSettings: public, service-role read of app_settings BUT the output is
 *   sanitized to a fixed whitelist of fields — nothing else from the table can leak.
 * - No write paths here. All writes are super-admin server functions.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FREE_SLOTS = 3;

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS: user can only see their own subscription row
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("plan, status, tenant_slots, expires_at, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { count } = await context.supabase
      .from("tenants")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", context.userId)
      .eq("is_active", true);

    const expired =
      !!sub?.expires_at && new Date(sub.expires_at).getTime() < Date.now();

    const slots =
      !sub ? FREE_SLOTS
      : sub.status !== "active" ? 0
      : expired ? FREE_SLOTS
      : sub.tenant_slots;

    return {
      plan: sub?.plan ?? "free",
      status: sub?.status ?? "active",
      expired,
      expires_at: sub?.expires_at ?? null,
      tenant_slots: slots,
      tenants_used: count ?? 0,
    };
  });

export const getMySubscriptionPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscription_payments")
      .select("id, amount_npr, method, reference, period_from, period_to, paid_at")
      .eq("user_id", context.userId)
      .order("paid_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/**
 * Public ads config — safe for unauthenticated callers.
 * Returns ONLY a sanitized whitelist; never the raw settings row.
 */
export const getAdsSettings = createServerFn({ method: "GET" }).handler(
  async () => {
    const FALLBACK = { enabled: false, client_id: "", slot_dashboard: "", slot_landing: "" };
    try {
      const url = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !serviceKey) return FALLBACK;

      const admin = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data } = await admin
        .from("app_settings")
        .select("value")
        .eq("key", "ads")
        .maybeSingle();

      const v = (data?.value ?? {}) as Record<string, unknown>;
      return {
        enabled: v.enabled === true,
        client_id: typeof v.client_id === "string" ? v.client_id.slice(0, 60) : "",
        slot_dashboard: typeof v.slot_dashboard === "string" ? v.slot_dashboard.slice(0, 30) : "",
        slot_landing: typeof v.slot_landing === "string" ? v.slot_landing.slice(0, 30) : "",
      };
    } catch {
      return FALLBACK;
    }
  },
);
