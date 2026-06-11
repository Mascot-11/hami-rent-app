/**
 * /api/enforce-rls
 *
 * READ-ONLY audit endpoint — returns the current RLS status of all tables.
 * Does NOT modify the database. Use the migration file to apply changes.
 *
 * Call: GET https://your-domain.com/api/enforce-rls
 *       with header: x-setup-token: <SETUP_SECRET>
 *
 * Set SETUP_SECRET as an env var in Vercel.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/enforce-rls")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Require setup secret
        const secret   = process.env.SETUP_SECRET;
        const provided = request.headers.get("x-setup-token");
        if (!secret || !provided || provided !== secret) {
          return json({ error: "Forbidden" }, 403);
        }

        const url        = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !serviceKey) {
          return json({ error: "Missing Supabase env vars" }, 500);
        }

        const supabase = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Audit: check RLS status via pg_class
        const { data: rlsStatus, error: rlsErr } = await supabase.rpc("audit_rls_status");

        // Audit: check policies
        const { data: policies, error: polErr } = await supabase
          .from("pg_policies")
          .select("schemaname, tablename, policyname, permissive, roles, cmd, qual")
          .eq("schemaname", "public")
          .in("tablename", ["tenants", "bills", "additional_charges", "payments", "admin_roles", "landlord_profiles"])
          .order("tablename");

        // Audit: check if admin user exists
        const { data: adminUsers } = await supabase
          .from("admin_roles")
          .select("user_id");

        const audit = {
          timestamp:    new Date().toISOString(),
          rls_status:   rlsErr  ? { error: rlsErr.message }  : rlsStatus,
          policies:     polErr  ? { error: polErr.message }   : policies,
          admin_count:  adminUsers?.length ?? 0,
          instructions: [
            "To apply security hardening, run the migration in Supabase SQL Editor:",
            "supabase/migrations/20260611000001_security_hardening.sql",
          ],
        };

        return json(audit, 200);
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
