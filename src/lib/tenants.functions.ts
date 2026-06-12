import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbError } from "@/lib/db-error";
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

/** Throws if the property doesn't belong to the authenticated user. */
async function assertPropertyOwner(supabase: any, propertyId: string, userId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("owner_id")
    .eq("id", propertyId)
    .single();
  if (error || !data) throw new Error("Property not found");
  if (data.owner_id !== userId) throw new Error("Forbidden");
}

/**
 * Throws if adding/activating one more tenant would exceed the user's
 * allocated slots. DB trigger enforces this too (defense in depth) —
 * this gives a friendlier error before hitting the DB.
 */
async function assertSlotAvailable(supabase: any, userId: string) {
  const { data: slots } = await supabase.rpc("get_tenant_slots", { uid: userId });
  const allowed = typeof slots === "number" ? slots : 3;
  const { count } = await supabase
    .from("tenants")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("is_active", true);
  if ((count ?? 0) >= allowed) {
    throw new Error(
      `Tenant slot limit reached (${count}/${allowed}). Contact the administrator to upgrade your plan.`,
    );
  }
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
    if (error) throw dbError(error);
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
  phone: z.string().trim().regex(/^(\+?977[- ]?)?(9[5-8]\d{8}|0\d{1,2}[- ]?\d{6,7})$/, "Invalid Nepali phone number").nullable().optional().or(z.literal("").transform(() => null)),
  move_in_date_bs: z.string().trim().regex(/^(20[7-9]\d|2110)-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[0-2])$/, "BS date must be YYYY-MM-DD").nullable().optional().or(z.literal("").transform(() => null)),
  notes: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
  photo_url: z.string().nullable().optional(),
  documents: z.array(z.object({ name: z.string().max(200), url: z.string().max(2000) })).optional(),
  base_rent: z.number().min(0).max(10_000_000).nullable().optional(),
  default_water_bill: z.number().min(0).max(1_000_000).nullable().optional(),
  property_id: z.string().uuid().nullable().optional().or(z.literal("").transform(() => null)),
});

export const upsertTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TenantInput.parse(d))
  .handler(async ({ data, context }) => {
    // For updates, verify ownership before writing
    if (data.id) {
      await assertTenantOwner(context.supabase, data.id, context.userId);
    }
    // If assigning to a property, verify the landlord owns that property.
    if (data.property_id) {
      await assertPropertyOwner(context.supabase, data.property_id, context.userId);
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
      property_id: data.property_id || null,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("tenants")
        .update(payload)
        .eq("id", data.id)
        .eq("owner_id", context.userId); // double-lock: explicit + RLS
      if (error) throw dbError(error);
      return { id: data.id };
    } else {
      if (data.is_active !== false) {
        await assertSlotAvailable(context.supabase, context.userId);
      }
      const { data: row, error } = await context.supabase
        .from("tenants")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw dbError(error);
      return { id: row.id };
    }
  });

export const setTenantActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; is_active: boolean }) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.is_active) {
      await assertSlotAvailable(context.supabase, context.userId);
    }
    const { error } = await context.supabase
      .from("tenants")
      .update({ is_active: data.is_active })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw dbError(error);
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
    if (error) throw dbError(error);
    return { ok: true };
  });
