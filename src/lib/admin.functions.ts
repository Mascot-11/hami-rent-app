/**
 * admin.functions.ts
 * All server functions here require super-admin role.
 * They use the service-role Supabase client so RLS is bypassed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ── Users ─────────────────────────────────────────────────────────────────────

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    // auth.users is not accessible via supabase-js without service role
    const { data, error } = await context.supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (error) throw new Error(error.message);

    // Fetch admin_roles to mark which users are admins
    const { data: roles } = await context.supabase
      .from("admin_roles")
      .select("user_id");
    const adminIds = new Set((roles ?? []).map((r: any) => r.user_id));

    return (data.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      is_admin: adminIds.has(u.id),
    }));
  });

export const adminGrantAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { user_id: string }) =>
    z.object({ user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("admin_roles")
      .insert({ user_id: data.user_id, granted_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRevokeAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { user_id: string }) =>
    z.object({ user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Prevent revoking yourself
    if (data.user_id === context.userId)
      throw new Error("Cannot revoke your own admin role");
    const { error } = await context.supabase
      .from("admin_roles")
      .delete()
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { user_id: string }) =>
    z.object({ user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId)
      throw new Error("Cannot delete your own account from admin panel");
    const { error } = await context.supabase.auth.admin.deleteUser(
      data.user_id,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Tenants (all users) ───────────────────────────────────────────────────────

export const adminListTenants = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    // NOTE: owner_id references auth.users, which PostgREST cannot embed
    // ("no relationship in schema cache"). Fetch tenants flat and merge
    // owner emails from the auth admin API instead.
    const [{ data, error }, usersRes] = await Promise.all([
      context.supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false }),
      context.supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    if (error) throw new Error(error.message);

    const emailById = new Map(
      (usersRes.data?.users ?? []).map((u) => [u.id, u.email ?? ""]),
    );
    return (data ?? []).map((t: any) => ({
      ...t,
      owner_email: emailById.get(t.owner_id) ?? null,
    }));
  });

export const adminDeleteTenant = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tenants")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateTenant = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(120),
      room_number: z.string().max(40).nullable().optional(),
      phone: z.string().max(30).nullable().optional(),
      move_in_date_bs: z.string().max(20).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
      is_active: z.boolean().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase
      .from("tenants")
      .update(rest)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Bills (all users) ─────────────────────────────────────────────────────────

export const adminListBills = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bills")
      .select(
        "*, additional_charges(*), payments(*), tenants(name, room_number)",
      )
      .order("bs_year", { ascending: false })
      .order("bs_month", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminDeleteBill = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("payments")
      .delete()
      .eq("bill_id", data.id);
    await context.supabase
      .from("additional_charges")
      .delete()
      .eq("bill_id", data.id);
    const { error } = await context.supabase
      .from("bills")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Payments (all users) ──────────────────────────────────────────────────────

export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("*, bills(bs_year, bs_month, tenants(name, room_number))")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminDeletePayment = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("payments")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Stats overview ────────────────────────────────────────────────────────────

export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const [users, tenants, bills, payments] = await Promise.all([
      context.supabase.auth.admin.listUsers({ perPage: 1 }),
      context.supabase.from("tenants").select("id", { count: "exact", head: true }),
      context.supabase.from("bills").select("id", { count: "exact", head: true }),
      context.supabase.from("payments").select("amount_paid"),
    ]);

    const totalRevenue = (payments.data ?? []).reduce(
      (s: number, p: any) => s + Number(p.amount_paid ?? 0),
      0,
    );

    return {
      userCount: (users.data as any)?.total ?? users.data?.users?.length ?? 0,
      tenantCount: tenants.count ?? 0,
      billCount: bills.count ?? 0,
      totalRevenue,
    };
  });

// ── Check if current user is admin (used client-side) ─────────────────────────

// Uses the lighter auth middleware + SECURITY DEFINER RPC so the admin gate
// works even when SUPABASE_SERVICE_ROLE_KEY is missing from the deployment.
// Reports whether the service key is configured so the UI can explain itself.
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc(
      "is_current_user_super_admin",
    );
    if (error) throw new Error("Admin role check failed");
    return {
      isAdmin: isAdmin === true,
      userId: context.userId,
      serviceKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  });

// ── Subscriptions & slot allocation (super admin) ─────────────────────────────

export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const [{ data: usersData, error: uErr }, { data: subs }, { data: tenants }] =
      await Promise.all([
        context.supabase.auth.admin.listUsers({ perPage: 1000 }),
        context.supabase.from("subscriptions").select("*"),
        context.supabase.from("tenants").select("owner_id, is_active"),
      ]);
    if (uErr) throw new Error(uErr.message);

    const subByUser = new Map((subs ?? []).map((s: any) => [s.user_id, s]));
    const usage = new Map<string, number>();
    for (const t of tenants ?? []) {
      if (t.is_active) usage.set(t.owner_id, (usage.get(t.owner_id) ?? 0) + 1);
    }

    return (usersData.users ?? []).map((u) => {
      const s: any = subByUser.get(u.id);
      const expired = !!s?.expires_at && new Date(s.expires_at).getTime() < Date.now();
      return {
        user_id: u.id,
        email: u.email ?? "",
        plan: s?.plan ?? "free",
        status: s?.status ?? "active",
        tenant_slots: s ? (s.status !== "active" ? 0 : expired ? 3 : s.tenant_slots) : 3,
        raw_slots: s?.tenant_slots ?? 3,
        expires_at: s?.expires_at ?? null,
        expired,
        tenants_used: usage.get(u.id) ?? 0,
        notes: s?.notes ?? null,
      };
    });
  });

export const adminSetSubscription = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      plan: z.enum(["free", "basic", "pro", "custom"]),
      status: z.enum(["active", "expired", "suspended"]),
      tenant_slots: z.number().int().min(0).max(10000),
      expires_at: z.string().datetime({ offset: true }).nullable().optional(),
      notes: z.string().max(1000).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subscriptions").upsert(
      {
        user_id: data.user_id,
        plan: data.plan,
        status: data.status,
        tenant_slots: data.tenant_slots,
        expires_at: data.expires_at ?? null,
        notes: data.notes ?? null,
        updated_by: context.userId,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminRecordSubscriptionPayment = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      amount_npr: z.number().min(0).max(100_000_000),
      method: z.enum(["manual", "cash", "bank_transfer", "esewa", "khalti", "other"]).default("manual"),
      reference: z.string().max(200).nullable().optional(),
      note: z.string().max(1000).nullable().optional(),
      period_from: z.string().max(20).nullable().optional(),
      period_to: z.string().max(20).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subscription_payments").insert({
      ...data,
      reference: data.reference || null,
      note: data.note || null,
      period_from: data.period_from || null,
      period_to: data.period_to || null,
      recorded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSubscriptionPayments = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscription_payments")
      .select("*")
      .order("paid_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ── App settings: ads (super admin) ───────────────────────────────────────────

export const adminGetAdsSettings = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", "ads")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      value: (data?.value as any) ?? {
        enabled: false, provider: "adsense", client_id: "", slot_dashboard: "", slot_landing: "",
      },
      updated_at: data?.updated_at ?? null,
    };
  });

export const adminUpdateAdsSettings = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: unknown) =>
    z.object({
      enabled: z.boolean(),
      client_id: z.string().max(60).regex(/^(ca-pub-\d{10,20})?$/, "Must look like ca-pub-XXXXXXXXXXXXXXXX or be empty"),
      slot_dashboard: z.string().max(30).regex(/^\d*$/, "Slot IDs are numeric"),
      slot_landing: z.string().max(30).regex(/^\d*$/, "Slot IDs are numeric"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("app_settings").upsert(
      {
        key: "ads",
        value: { provider: "adsense", ...data },
        updated_by: context.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
