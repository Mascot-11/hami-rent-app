-- ============================================================
-- HAMRO RENT — SECURITY PATCH
-- Run this IMMEDIATELY in Supabase SQL Editor
-- ============================================================

-- ─── 1. Enable RLS on every private table ───────────────────

ALTER TABLE public.tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_charges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landlord_profiles   ENABLE ROW LEVEL SECURITY;

-- ─── 2. Drop any existing permissive policies (clean slate) ─

DROP POLICY IF EXISTS "tenants_select"            ON public.tenants;
DROP POLICY IF EXISTS "tenants_insert"            ON public.tenants;
DROP POLICY IF EXISTS "tenants_update"            ON public.tenants;
DROP POLICY IF EXISTS "tenants_delete"            ON public.tenants;
DROP POLICY IF EXISTS "bills_select"              ON public.bills;
DROP POLICY IF EXISTS "bills_insert"              ON public.bills;
DROP POLICY IF EXISTS "bills_update"              ON public.bills;
DROP POLICY IF EXISTS "bills_delete"              ON public.bills;
DROP POLICY IF EXISTS "payments_select"           ON public.payments;
DROP POLICY IF EXISTS "payments_insert"           ON public.payments;
DROP POLICY IF EXISTS "payments_update"           ON public.payments;
DROP POLICY IF EXISTS "payments_delete"           ON public.payments;
DROP POLICY IF EXISTS "charges_select"            ON public.additional_charges;
DROP POLICY IF EXISTS "charges_insert"            ON public.additional_charges;
DROP POLICY IF EXISTS "charges_update"            ON public.additional_charges;
DROP POLICY IF EXISTS "charges_delete"            ON public.additional_charges;
DROP POLICY IF EXISTS "profiles_select"           ON public.landlord_profiles;
DROP POLICY IF EXISTS "profiles_insert"           ON public.landlord_profiles;
DROP POLICY IF EXISTS "profiles_update"           ON public.landlord_profiles;
-- catch any old open policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tenants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bills;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.payments;
DROP POLICY IF EXISTS "Allow all"                        ON public.tenants;
DROP POLICY IF EXISTS "Allow all"                        ON public.bills;

-- ─── 3. Strict owner-only RLS policies ──────────────────────

-- tenants
CREATE POLICY "tenants_select" ON public.tenants
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "tenants_insert" ON public.tenants
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_update" ON public.tenants
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_delete" ON public.tenants
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- bills
CREATE POLICY "bills_select" ON public.bills
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "bills_insert" ON public.bills
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "bills_update" ON public.bills
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "bills_delete" ON public.bills
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- payments
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "payments_update" ON public.payments
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "payments_delete" ON public.payments
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- additional_charges
CREATE POLICY "charges_select" ON public.additional_charges
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "charges_insert" ON public.additional_charges
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "charges_update" ON public.additional_charges
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "charges_delete" ON public.additional_charges
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- landlord_profiles
CREATE POLICY "profiles_select" ON public.landlord_profiles
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "profiles_insert" ON public.landlord_profiles
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "profiles_update" ON public.landlord_profiles
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ─── 4. Block anon from all private tables ───────────────────

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.tenants            FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.bills              FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.payments           FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.additional_charges FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.landlord_profiles  FROM anon;

-- ─── 5. Safe aggregate table for public stats ────────────────
-- The public landing page reads ONLY this table — never private tables.

CREATE TABLE IF NOT EXISTS public.public_platform_stats (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_count      integer NOT NULL DEFAULT 0,
  tenant_count        integer NOT NULL DEFAULT 0,
  total_payments_npr  numeric(20,2) NOT NULL DEFAULT 0,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Anyone (including anon) can read this — it contains only counts, no personal data
ALTER TABLE public.public_platform_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_public_read" ON public.public_platform_stats
  FOR SELECT TO anon, authenticated USING (true);

-- Only the service role (Supabase scheduled function) can write
REVOKE INSERT, UPDATE, DELETE ON public.public_platform_stats FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.public_platform_stats FROM authenticated;

-- Seed one row with current counts
INSERT INTO public.public_platform_stats (landlord_count, tenant_count, total_payments_npr)
SELECT
  (SELECT COUNT(*) FROM public.landlord_profiles),
  (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
  (SELECT COALESCE(SUM(amount_paid), 0) FROM public.payments)
ON CONFLICT DO NOTHING;

-- ─── 6. Auto-refresh stats with a trigger ───────────────────
-- Fires after any payment insert so the public counter stays current.

CREATE OR REPLACE FUNCTION public.refresh_platform_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.public_platform_stats SET
    landlord_count     = (SELECT COUNT(*) FROM public.landlord_profiles),
    tenant_count       = (SELECT COUNT(*) FROM public.tenants WHERE is_active = true),
    total_payments_npr = (SELECT COALESCE(SUM(amount_paid), 0) FROM public.payments),
    updated_at         = now();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS refresh_stats_on_payment ON public.payments;
CREATE TRIGGER refresh_stats_on_payment
  AFTER INSERT OR DELETE ON public.payments
  FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_platform_stats();

DROP TRIGGER IF EXISTS refresh_stats_on_tenant ON public.tenants;
CREATE TRIGGER refresh_stats_on_tenant
  AFTER INSERT OR UPDATE OR DELETE ON public.tenants
  FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_platform_stats();
