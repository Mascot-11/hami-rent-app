import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("landlord_profiles")
      .select("*")
      .eq("owner_id", context.userId)
      .single();
    if (error && error.code !== "PGRST116") throw new Error(error.message); // PGRST116 = no rows
    return data ?? null;
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = {
      owner_id: context.userId,
      full_name: data.full_name,
      phone: data.phone || null,
      address: data.address || null,
    };
    const { error } = await context.supabase
      .from("landlord_profiles")
      .upsert(payload, { onConflict: "owner_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
