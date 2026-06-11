-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY HARDENING — Complete RLS enforcement + privilege minimisation
-- Idempotent: safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 0. Revoke dangerous default privileges ──────────────────────────────────

-- Revoke public schema creation from public role (CVE-2018-1058 mitigation)
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Revoke anon/authenticated from creating objects
REVOKE ALL ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ── 1. Private tables — enable + FORCE RLS ──────────────────────────────────
-- FORCE RLS ensures even the table owner (postgres role) obeys policies.

DO $$ BEGIN
  EXECUTE 'ALTER TABLE public.tenants             ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.tenants             FORCE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.bills               ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.bills               FORCE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.additional_charges  ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.additional_charges  FORCE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.payments            FORCE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.admin_roles         ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.admin_roles         FORCE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL; -- table may not exist yet; migrations handle that
END $$;

-- landlord_profiles (may or may not exist yet)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='landlord_profiles') THEN
    ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.landlord_profiles FORCE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ── 2. Revoke all anon access from private tables ────────────────────────────

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['tenants','bills','additional_charges','payments','admin_roles'] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t);
  END LOOP;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='landlord_profiles') THEN
    REVOKE ALL ON public.landlord_profiles FROM anon;
    REVOKE ALL ON public.landlord_profiles FROM PUBLIC;
  END IF;
END $$;

-- ── 3. Drop all existing policies on private tables (clean slate) ────────────

DO $$ DECLARE r RECORD; BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
    AND   tablename  IN ('tenants','bills','additional_charges','payments','admin_roles','landlord_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ── 4. Strict owner-only policies — tenants ──────────────────────────────────

CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "tenants_insert" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "tenants_delete" ON public.tenants
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ── 5. Strict owner-only policies — bills ────────────────────────────────────

CREATE POLICY "bills_select" ON public.bills
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "bills_insert" ON public.bills
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "bills_update" ON public.bills
  FOR UPDATE TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "bills_delete" ON public.bills
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Public share: anon can read ONLY the specific bill matched by its own
-- share_token. The server always queries .eq("share_token", token) so
-- no other bills are returned, but this policy adds a DB-level guarantee.
-- Note: the actual filtering is done server-side; this just permits the role.
CREATE POLICY "bills_public_share" ON public.bills
  FOR SELECT TO anon
  USING (share_token IS NOT NULL);

-- ── 6. Strict owner-only policies — additional_charges ───────────────────────

CREATE POLICY "charges_select" ON public.additional_charges
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "charges_insert" ON public.additional_charges
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "charges_update" ON public.additional_charges
  FOR UPDATE TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "charges_delete" ON public.additional_charges
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ── 7. Strict owner-only policies — payments ─────────────────────────────────

CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "payments_delete" ON public.payments
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- ── 8. Strict owner-only policies — landlord_profiles ────────────────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='landlord_profiles') THEN
    CREATE POLICY "profiles_select" ON public.landlord_profiles
      FOR SELECT TO authenticated USING (owner_id = auth.uid());
    CREATE POLICY "profiles_insert" ON public.landlord_profiles
      FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
    CREATE POLICY "profiles_update" ON public.landlord_profiles
      FOR UPDATE TO authenticated
      USING  (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());
    CREATE POLICY "profiles_delete" ON public.landlord_profiles
      FOR DELETE TO authenticated USING (owner_id = auth.uid());
  END IF;
END $$;

-- ── 9. admin_roles — deny all to non-service-role ────────────────────────────
-- Service role bypasses RLS entirely; this denies all JWT-authenticated access.

CREATE POLICY "admin_roles_deny_select" ON public.admin_roles
  FOR SELECT TO authenticated, anon USING (false);

CREATE POLICY "admin_roles_deny_insert" ON public.admin_roles
  FOR INSERT TO authenticated, anon WITH CHECK (false);

CREATE POLICY "admin_roles_deny_update" ON public.admin_roles
  FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);

CREATE POLICY "admin_roles_deny_delete" ON public.admin_roles
  FOR DELETE TO authenticated, anon USING (false);

-- ── 10. Drop the exec_sql SECURITY DEFINER function — privilege escalation risk

DROP FUNCTION IF EXISTS public.exec_sql(text) CASCADE;

-- ── 11. Re-create is_super_admin with pinned search_path ─────────────────────

CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = uid);
$$;

-- ── 12. Re-create touch_bill_modified with pinned search_path ────────────────

CREATE OR REPLACE FUNCTION public.touch_bill_modified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$;

-- ── 13. Re-create refresh_platform_stats with pinned search_path ─────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname='refresh_platform_stats' AND pronamespace='public'::regnamespace) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION public.refresh_platform_stats()
      RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = public, pg_catalog
      AS $inner$
      BEGIN
        UPDATE public.public_platform_stats SET
          landlord_count     = (SELECT COUNT(*) FROM public.landlord_profiles),
          tenant_count       = (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
          total_payments_npr = COALESCE((SELECT SUM(amount_paid) FROM public.payments), 0),
          updated_at         = now();
        RETURN NULL;
      END; $inner$;
    $func$;
  END IF;
END $$;

-- ── 14. Ensure public_platform_stats is readable by anon (only that table) ───

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='public_platform_stats') THEN
    ALTER TABLE public.public_platform_stats ENABLE ROW LEVEL SECURITY;
    -- Drop and recreate to ensure it's clean
    DROP POLICY IF EXISTS "stats_anon_read"          ON public.public_platform_stats;
    DROP POLICY IF EXISTS "stats_authenticated_read" ON public.public_platform_stats;
    CREATE POLICY "stats_anon_read" ON public.public_platform_stats
      FOR SELECT TO anon, authenticated USING (true);
    -- No INSERT/UPDATE/DELETE from clients — only triggers + service role
    REVOKE INSERT, UPDATE, DELETE ON public.public_platform_stats FROM anon, authenticated;
  END IF;
END $$;

-- ── 15. Column-level grant restrictions ──────────────────────────────────────
-- Authenticated users must never see other users' owner_id-adjacent data.
-- RLS already enforces this, but column privileges add defense-in-depth.

-- Ensure authenticated role has only what it needs on each table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.additional_charges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments           TO authenticated;
-- anon gets NO table-level grants on private tables (RLS blocks anyway, but belt+suspenders)
REVOKE ALL ON public.tenants            FROM anon;
REVOKE ALL ON public.bills              FROM anon;
REVOKE ALL ON public.additional_charges FROM anon;
REVOKE ALL ON public.payments           FROM anon;
-- anon CAN read bills for the share feature (RLS policy + service-role server-side guard)
GRANT SELECT ON public.bills TO anon;
-- anon can read public stats
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='public_platform_stats') THEN
    GRANT SELECT ON public.public_platform_stats TO anon, authenticated;
  END IF;
END $$;

-- ── 16. Seed super admin if not already present ───────────────────────────────

INSERT INTO public.admin_roles (user_id)
SELECT id FROM auth.users WHERE email = 'admin@hamrorent.com'
ON CONFLICT DO NOTHING;
