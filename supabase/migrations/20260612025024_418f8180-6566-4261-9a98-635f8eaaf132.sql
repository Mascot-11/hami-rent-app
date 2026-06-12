
-- 1. Drop unsafe anon policies
DROP POLICY IF EXISTS "Allow public read for shared bill tenants" ON public.tenants;
DROP POLICY IF EXISTS "Allow public read by share_token" ON public.bills;
DROP POLICY IF EXISTS "Allow public read for shared bill additional_charges" ON public.additional_charges;
DROP POLICY IF EXISTS "Allow public read for shared bill payments" ON public.payments;

-- Revoke anon SELECT grants since the public share page uses service role
REVOKE SELECT ON public.tenants FROM anon;
REVOKE SELECT ON public.bills FROM anon;
REVOKE SELECT ON public.additional_charges FROM anon;
REVOKE SELECT ON public.payments FROM anon;

-- 2. Drop redundant unscoped storage SELECT policy
DROP POLICY IF EXISTS "tenant_docs_select" ON storage.objects;

-- 3. app_settings: super admin only (table is currently policy-less, breaking admin UI)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

DROP POLICY IF EXISTS "app_settings_super_admin_select" ON public.app_settings;
CREATE POLICY "app_settings_super_admin_select" ON public.app_settings
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "app_settings_super_admin_write" ON public.app_settings;
CREATE POLICY "app_settings_super_admin_write" ON public.app_settings
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

-- 4. Pin search_path on touch_* trigger functions
CREATE OR REPLACE FUNCTION public.touch_profile_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 5. Lock down is_current_user_super_admin: only authenticated callers
REVOKE ALL ON FUNCTION public.is_current_user_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_current_user_super_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_super_admin() TO authenticated;
