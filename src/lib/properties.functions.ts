import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbError } from "@/lib/db-error";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS enforces owner_id = auth.uid(); explicit filter as a safety belt.
    const { data, error } = await context.supabase
      .from("properties")
      .select("*")
      .eq("owner_id", context.userId)
      .order("name");
    if (error) throw dbError(error);
    return data ?? [];
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

const PropertyInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  address: z
    .string()
    .trim()
    .max(300)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export const upsertProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PropertyInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      address: data.address || null,
      owner_id: context.userId, // always stamp — cannot be overridden by input
    };

    if (data.id) {
      // Verify ownership before writing.
      const { data: existing, error: selErr } = await context.supabase
        .from("properties")
        .select("owner_id")
        .eq("id", data.id)
        .single();
      if (selErr || !existing) throw new Error("Property not found");
      if (existing.owner_id !== context.userId) throw new Error("Forbidden");

      const { error } = await context.supabase
        .from("properties")
        .update(payload)
        .eq("id", data.id)
        .eq("owner_id", context.userId);
      if (error) throw dbError(error);
      return { id: data.id };
    }

    const { data: row, error } = await context.supabase
      .from("properties")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw dbError(error);
    return { id: row.id };
  });

export const deleteProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Verify ownership before delete. Tenants are NOT deleted — the FK is
    // ON DELETE SET NULL, so they fall back to "Ungrouped".
    const { data: existing, error: selErr } = await context.supabase
      .from("properties")
      .select("owner_id")
      .eq("id", data.id)
      .single();
    if (selErr || !existing) throw new Error("Property not found");
    if (existing.owner_id !== context.userId) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("properties")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw dbError(error);
    return { ok: true };
  });
