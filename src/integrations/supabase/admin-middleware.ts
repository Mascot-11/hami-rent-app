/**
 * admin-middleware.ts
 * Extends requireSupabaseAuth with an admin check.
 * Uses the SERVICE ROLE key so it can bypass RLS to read admin_roles.
 * Never expose the service role key to the client.
 */
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const requireAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // ── 1. Verify the user's JWT (same as requireSupabaseAuth) ────────────
    const request = getRequest();
    if (!request?.headers) throw new Error("Unauthorized: no request headers");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      throw new Error("Unauthorized: missing bearer token");

    const token = authHeader.replace("Bearer ", "");

    // User-scoped client — validates the JWT
    const userClient = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      },
    );

    const { data, error } = await userClient.auth.getClaims(token);
    if (error || !data?.claims?.sub)
      throw new Error("Unauthorized: invalid token");

    const userId = data.claims.sub as string;

    // ── 2. Check admin_roles via service-role client (bypasses RLS) ───────
    // Fall back to user client if no service role key (dev without it)
    const adminClient = SUPABASE_SERVICE_ROLE_KEY
      ? createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        })
      : userClient;

    const { data: roleRow } = await adminClient
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleRow) throw new Error("Forbidden: super admin access required");

    return next({
      context: {
        supabase: adminClient, // admin client for all subsequent queries
        userClient,            // user-scoped client if needed
        userId,
        claims: data.claims,
        isAdmin: true,
      },
    });
  },
);
