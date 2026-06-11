import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Throws if the tenant doesn't belong to the authenticated user. */
async function assertTenantOwner(supabase: any, tenantId: string, userId: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("owner_id")
    .eq("id", tenantId)
    .single();
  if (error || !data) throw new Error("Tenant not found");
  if (data.owner_id !== userId) throw new Error("Forbidden");
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS enforces owner_id = auth.uid() — we add it explicitly as a safety belt
    const { data, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("owner_id", context.userId)
      .order("is_active", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: tenant, error } = await context.supabase
      .from("tenants")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", context.userId) // explicit ownership check — never rely solely on RLS
      .single();
    if (error) throw new Error("Tenant not found");
    return tenant;
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

const TenantInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  room_number: z.string().trim().max(40).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  move_in_date_bs: z.string().trim().max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
  photo_url: z.string().nullable().optional(),
  documents: z.array(z.object({ name: z.string().max(200), url: z.string().max(2000) })).optional(),
  base_rent: z.number().min(0).max(10_000_000).nullable().optional(),
  default_water_bill: z.number().min(0).max(1_000_000).nullable().optional(),
});

export const upsertTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TenantInput.parse(d))
  .handler(async ({ data, context }) => {
    // For updates, verify ownership before writing
    if (data.id) {
      await assertTenantOwner(context.supabase, data.id, context.userId);
    }

    const payload = {
      ...data,
      owner_id: context.userId, // always stamp — cannot be overridden by input
      room_number: data.room_number || null,
      phone: data.phone || null,
      move_in_date_bs: data.move_in_date_bs || null,
      notes: data.notes || null,
      photo_url: data.photo_url || null,
      documents: data.documents ?? [],
      base_rent: data.base_rent ?? null,
      default_water_bill: data.default_water_bill ?? null,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("tenants")
        .update(payload)
        .eq("id", data.id)
        .eq("owner_id", context.userId); // double-lock: explicit + RLS
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await context.supabase
        .from("tenants")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }
  });

export const setTenantActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_active: boolean }) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tenants")
      .update({ is_active: data.is_active })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Verify ownership before delete
    await assertTenantOwner(context.supabase, data.id, context.userId);
    const { error } = await context.supabase
      .from("tenants")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
