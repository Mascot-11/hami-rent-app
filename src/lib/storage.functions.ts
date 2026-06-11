/**
 * storage.functions.ts
 *
 * tenant-docs is a PRIVATE bucket (see security migration). Files are stored at
 * "<owner_uid>/<tenant_id>/<file>". We store the PATH (not a public URL) and
 * mint short-lived signed URLs on demand, server-side, only for files the
 * caller owns.
 *
 * Security:
 * - requireSupabaseAuth verifies the JWT.
 * - We refuse any path whose first segment isn't the caller's own uid, so a
 *   user can never sign a URL for someone else's file even by guessing paths.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SIGN_TTL = 60 * 10; // 10 minutes

export const getSignedUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ paths: z.array(z.string().max(500)).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return {};

    // Only sign paths the caller owns: first folder segment must equal uid.
    const owned = data.paths.filter(
      (p) => p.split("/")[0] === context.userId,
    );
    if (owned.length === 0) return {};

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const out: Record<string, string> = {};
    const { data: signed } = await admin.storage
      .from("tenant-docs")
      .createSignedUrls(owned, SIGN_TTL);

    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) out[s.path] = s.signedUrl;
    }
    return out;
  });
