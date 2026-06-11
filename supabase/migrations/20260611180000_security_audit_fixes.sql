-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY AUDIT FIXES
-- Idempotent. Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── FIX 1 (CRITICAL): anon could read EVERY bill via the share policy ────────
-- The old policy `USING (share_token IS NOT NULL)` lets an anonymous client run
--   supabase.from('bills').select('*')
-- with the anon key and receive ALL bills (every bill has a token). The public
-- share page goes through a service-role endpoint that filters by token, so it
-- never needed an anon RLS policy at all. Remove anon's access entirely; the
-- endpoint keeps working because the service role bypasses RLS.
DROP POLICY IF EXISTS "bills_public_share" ON public.bills;
REVOKE ALL ON public.bills FROM anon;

-- Belt & suspenders: same for the embedded relations the share page reads.
-- These are fetched server-side via service role, so anon needs no access.
REVOKE ALL ON public.additional_charges FROM anon;
REVOKE ALL ON public.payments          FROM anon;
REVOKE ALL ON public.tenants           FROM anon;

-- ── FIX 2: Storage — restrict the tenant-docs bucket to per-owner folders ────
-- Files are uploaded under path  "<owner_uid>/<tenant_id>/<file>".
-- Without policies, a public bucket lets anyone list/download every file by URL.
-- Make the bucket PRIVATE and allow each user only their own top-level folder.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'tenant-docs') THEN
    UPDATE storage.buckets SET public = false WHERE id = 'tenant-docs';
  ELSE
    INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-docs','tenant-docs', false);
  END IF;
END $$;

DROP POLICY IF EXISTS "tenant_docs_select_own" ON storage.objects;
DROP POLICY IF EXISTS "tenant_docs_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "tenant_docs_update_own" ON storage.objects;
DROP POLICY IF EXISTS "tenant_docs_delete_own" ON storage.objects;

CREATE POLICY "tenant_docs_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tenant-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "tenant_docs_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tenant-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "tenant_docs_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'tenant-docs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'tenant-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "tenant_docs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tenant-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── FIX 3: Pin search_path on every SECURITY DEFINER function ────────────────
-- A SECURITY DEFINER function without a fixed search_path can be hijacked by a
-- caller who creates a malicious object in a schema earlier on their path.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', r.sig);
  END LOOP;
END $$;

-- ── FIX 4: Lock down the trigger-maintenance helper ──────────────────────────
-- touch_updated_at runs as trigger; ensure no surprising privileges.
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC;

-- ── FIX 5: Re-assert least privilege on private tables (idempotent) ──────────
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants','bills','additional_charges','payments',
    'admin_roles','subscriptions','subscription_payments','app_settings'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC', t);
    END IF;
  END LOOP;
END $$;
