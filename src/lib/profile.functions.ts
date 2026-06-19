import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { dbError } from "@/lib/db-error";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^(\+?977[- ]?)?(9[5-8]\d{8}|0\d{1,2}[- ]?\d{6,7})$/, "Invalid Nepali phone number").nullable().optional().or(z.literal("").transform(() => null)),
  address: z.string().trim().max(300).nullable().optional(),
  // Storage PATH in the private "tenant-docs" bucket (e.g. "<uid>/qr/payment_qr_...png"),
  // not a public URL. Must stay within the caller's own folder.
  payment_qr_path: z.string().trim().max(500).nullable().optional(),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("landlord_profiles")
      .select("*")
      .eq("owner_id", context.userId)
      .single();
    if (error && error.code !== "PGRST116") throw dbError(error); // PGRST116 = no rows
    return data ?? null;
  });

export const upsertProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    // Defense in depth: even though storage RLS already enforces this, never
    // let a caller persist a QR path that points outside their own folder.
    if (data.payment_qr_path && data.payment_qr_path.split("/")[0] !== context.userId) {
      throw new Error("Invalid QR path");
    }
    const payload = {
      owner_id: context.userId,
      full_name: data.full_name,
      phone: data.phone || null,
      address: data.address || null,
      payment_qr_path: data.payment_qr_path || null,
    };
    const { error } = await context.supabase
      .from("landlord_profiles")
      .upsert(payload, { onConflict: "owner_id" });
    if (error) throw dbError(error);
    return { ok: true };
  });
