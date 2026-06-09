/**
 * admin.functions.ts
 * All server functions here require super-admin role.
 * They use the service-role Supabase client so RLS is bypassed.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/integrations/supabase/admin-middleware";

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
    const { data, error } = await context.supabase
      .from("tenants")
      .select("*, owner:owner_id(id)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
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
      userCount: users.data?.total ?? 0,
      tenantCount: tenants.count ?? 0,
      billCount: bills.count ?? 0,
      totalRevenue,
    };
  });

// ── Check if current user is admin (used client-side) ─────────────────────────

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => ({ isAdmin: true, userId: context.userId }));
