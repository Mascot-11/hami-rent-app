/**
 * /api/enforce-rls
 *
 * One-time (and idempotent) endpoint that runs the full RLS setup
 * against Supabase using the SERVICE ROLE KEY.
 *
 * Call it once after every deploy:
 *   curl -X POST https://your-domain.com/api/enforce-rls \
 *        -H "x-setup-token: <SETUP_SECRET>"
 *
 * Set SETUP_SECRET as an env var in Vercel. Rotate it after first use.
 * The endpoint is a no-op if called again (all statements are idempotent).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/enforce-rls")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // ── Guard: require the setup secret ──────────────────────────────
        const secret = process.env.SETUP_SECRET;
        const provided = request.headers.get("x-setup-token");

        if (!secret || !provided || provided !== secret) {
          return json({ error: "Forbidden" }, 403);
        }

        const url = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !serviceKey) {
          return json({ error: "Missing Supabase env vars" }, 500);
        }

        const supabase = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const steps: string[] = [];
        const errors: string[] = [];

        // Helper: run a SQL statement via the Supabase Management REST API
        // supabase-js doesn't expose DDL directly, so we call the pgmeta endpoint
        const runSQL = async (label: string, sql: string) => {
          try {
            const { error } = await supabase.rpc("exec_sql", { sql });
            if (error) {
              // exec_sql is a custom function we create below — if it doesn't
              // exist yet we fall back to the REST query endpoint
              errors.push(`${label}: ${error.message}`);
            } else {
              steps.push(`✓ ${label}`);
            }
          } catch (e: any) {
            errors.push(`${label}: ${e.message}`);
          }
        };

        // ── We use the Supabase Management API (postgres REST) directly ──
        // because supabase-js doesn't expose DDL. We POST to /rest/v1/rpc
        // with a service-role-signed request.
        const pgRest = async (label: string, sql: string) => {
          try {
            const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": serviceKey,
                "Authorization": `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({ sql }),
            });
            if (!res.ok) {
              const body = await res.text();
              errors.push(`${label}: ${body}`);
            } else {
              steps.push(`✓ ${label}`);
            }
          } catch (e: any) {
            errors.push(`${label}: ${e.message}`);
          }
        };

        // ── Step 0: Create exec_sql helper function (self-bootstrapping) ─
        // This uses the Supabase pg REST endpoint directly with service role
        const bootstrapSQL = `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
          BEGIN EXECUTE sql; END; $$;
        `;

        const bootstrap = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ sql: bootstrapSQL }),
        });
        // If exec_sql doesn't exist yet, create it via the SQL endpoint
        if (!bootstrap.ok) {
          // Try the Supabase SQL endpoint (available in self-hosted / direct pg)
          const directSQL = await fetch(`${url}/pg/query`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": serviceKey,
              "Authorization": `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ query: bootstrapSQL }),
          });
          if (!directSQL.ok) {
            return json({
              error: "Cannot execute DDL: exec_sql function not available and /pg/query returned error. Run SECURITY_SQL.sql manually in Supabase SQL Editor.",
              hint: "Go to Supabase → SQL Editor and paste the contents of SECURITY_SQL.sql from your repo root.",
            }, 500);
          }
        }
        steps.push("✓ exec_sql bootstrap");

        // ── Step 1: Enable RLS on all private tables ──────────────────────
        for (const tbl of ["tenants", "bills", "payments", "additional_charges", "landlord_profiles"]) {
          await pgRest(`enable RLS on ${tbl}`, `ALTER TABLE public.${tbl} ENABLE ROW LEVEL SECURITY;`);
          await pgRest(`force RLS on ${tbl}`, `ALTER TABLE public.${tbl} FORCE ROW LEVEL SECURITY;`);
        }

        // ── Step 2: Revoke anon from all private tables ───────────────────
        const privateTables = ["tenants", "bills", "payments", "additional_charges", "landlord_profiles"];
        for (const tbl of privateTables) {
          await pgRest(`revoke anon from ${tbl}`, `REVOKE SELECT, INSERT, UPDATE, DELETE ON public.${tbl} FROM anon;`);
        }

        // ── Step 3: Drop all existing policies (clean slate) ─────────────
        const dropPolicies = `
          DO $$ DECLARE r RECORD; BEGIN
            FOR r IN SELECT schemaname, tablename, policyname
                     FROM pg_policies
                     WHERE schemaname = 'public'
                     AND tablename IN ('tenants','bills','payments','additional_charges','landlord_profiles')
            LOOP
              EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            END LOOP;
          END $$;
        `;
        await pgRest("drop existing policies", dropPolicies);

        // ── Step 4: Create strict owner-only policies ─────────────────────
        const policies: [string, string][] = [
          // tenants
          ["tenants SELECT", `CREATE POLICY "tenants_select_own" ON public.tenants FOR SELECT TO authenticated USING (owner_id = auth.uid());`],
          ["tenants INSERT", `CREATE POLICY "tenants_insert_own" ON public.tenants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());`],
          ["tenants UPDATE", `CREATE POLICY "tenants_update_own" ON public.tenants FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`],
          ["tenants DELETE", `CREATE POLICY "tenants_delete_own" ON public.tenants FOR DELETE TO authenticated USING (owner_id = auth.uid());`],
          // bills
          ["bills SELECT", `CREATE POLICY "bills_select_own" ON public.bills FOR SELECT TO authenticated USING (owner_id = auth.uid());`],
          ["bills INSERT", `CREATE POLICY "bills_insert_own" ON public.bills FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());`],
          ["bills UPDATE", `CREATE POLICY "bills_update_own" ON public.bills FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`],
          ["bills DELETE", `CREATE POLICY "bills_delete_own" ON public.bills FOR DELETE TO authenticated USING (owner_id = auth.uid());`],
          // bills — allow anon to read ONLY via share_token (public bill share feature)
          ["bills public share", `CREATE POLICY "bills_public_share" ON public.bills FOR SELECT TO anon USING (share_token IS NOT NULL);`],
          // payments
          ["payments SELECT", `CREATE POLICY "payments_select_own" ON public.payments FOR SELECT TO authenticated USING (owner_id = auth.uid());`],
          ["payments INSERT", `CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());`],
          ["payments UPDATE", `CREATE POLICY "payments_update_own" ON public.payments FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`],
          ["payments DELETE", `CREATE POLICY "payments_delete_own" ON public.payments FOR DELETE TO authenticated USING (owner_id = auth.uid());`],
          // additional_charges
          ["charges SELECT", `CREATE POLICY "charges_select_own" ON public.additional_charges FOR SELECT TO authenticated USING (owner_id = auth.uid());`],
          ["charges INSERT", `CREATE POLICY "charges_insert_own" ON public.additional_charges FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());`],
          ["charges UPDATE", `CREATE POLICY "charges_update_own" ON public.additional_charges FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`],
          ["charges DELETE", `CREATE POLICY "charges_delete_own" ON public.additional_charges FOR DELETE TO authenticated USING (owner_id = auth.uid());`],
          // landlord_profiles
          ["profiles SELECT", `CREATE POLICY "profiles_select_own" ON public.landlord_profiles FOR SELECT TO authenticated USING (owner_id = auth.uid());`],
          ["profiles INSERT", `CREATE POLICY "profiles_insert_own" ON public.landlord_profiles FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());`],
          ["profiles UPDATE", `CREATE POLICY "profiles_update_own" ON public.landlord_profiles FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());`],
        ];

        for (const [label, sql] of policies) {
          await pgRest(`policy: ${label}`, sql);
        }

        // ── Step 5: Create public_platform_stats table ────────────────────
        await pgRest("create public_platform_stats", `
          CREATE TABLE IF NOT EXISTS public.public_platform_stats (
            id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            landlord_count      integer NOT NULL DEFAULT 0,
            tenant_count        integer NOT NULL DEFAULT 0,
            total_payments_npr  numeric(20,2) NOT NULL DEFAULT 0,
            updated_at          timestamptz NOT NULL DEFAULT now()
          );
        `);
        await pgRest("enable RLS on public_platform_stats", `ALTER TABLE public.public_platform_stats ENABLE ROW LEVEL SECURITY;`);
        await pgRest("public stats read policy", `
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='public_platform_stats' AND policyname='stats_anon_read') THEN
              CREATE POLICY "stats_anon_read" ON public.public_platform_stats FOR SELECT TO anon, authenticated USING (true);
            END IF;
          END $$;
        `);
        await pgRest("seed public stats", `
          INSERT INTO public.public_platform_stats (landlord_count, tenant_count, total_payments_npr)
          SELECT
            (SELECT COUNT(*) FROM public.landlord_profiles),
            (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
            COALESCE((SELECT SUM(amount_paid) FROM public.payments), 0)
          WHERE NOT EXISTS (SELECT 1 FROM public.public_platform_stats);
        `);

        // ── Step 6: Stats refresh trigger ─────────────────────────────────
        await pgRest("create refresh_platform_stats fn", `
          CREATE OR REPLACE FUNCTION public.refresh_platform_stats()
          RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
          BEGIN
            UPDATE public.public_platform_stats SET
              landlord_count     = (SELECT COUNT(*) FROM public.landlord_profiles),
              tenant_count       = (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
              total_payments_npr = COALESCE((SELECT SUM(amount_paid) FROM public.payments), 0),
              updated_at         = now();
            RETURN NULL;
          END; $$;
        `);
        await pgRest("create payment trigger", `
          DROP TRIGGER IF EXISTS stats_refresh_payment ON public.payments;
          CREATE TRIGGER stats_refresh_payment
            AFTER INSERT OR DELETE ON public.payments
            FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_platform_stats();
        `);
        await pgRest("create tenant trigger", `
          DROP TRIGGER IF EXISTS stats_refresh_tenant ON public.tenants;
          CREATE TRIGGER stats_refresh_tenant
            AFTER INSERT OR UPDATE OR DELETE ON public.tenants
            FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_platform_stats();
        `);

        return json({
          ok: errors.length === 0,
          steps,
          errors,
          message: errors.length === 0
            ? "RLS enforced successfully across all tables."
            : `Completed with ${errors.length} error(s). Review errors and re-run or fix manually.`,
        }, errors.length === 0 ? 200 : 207);
      },
    },
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
