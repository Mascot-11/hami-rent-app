import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tenants")
      .select("*")
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
      .from("tenants").select("*").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    return tenant;
  });

const TenantInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  room_number: z.string().trim().max(40).nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  move_in_date_bs: z.string().trim().max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const upsertTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TenantInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = {
      ...data,
      owner_id: context.userId,
      room_number: data.room_number || null,
      phone: data.phone || null,
      move_in_date_bs: data.move_in_date_bs || null,
      notes: data.notes || null,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("tenants").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    } else {
      const { data: row, error } = await context.supabase
        .from("tenants").insert(payload).select("id").single();
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
      .from("tenants").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tenants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
