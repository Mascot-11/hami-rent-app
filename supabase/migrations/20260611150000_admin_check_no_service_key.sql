-- ═══════════════════════════════════════════════════════════════════════════
-- Admin check without service-role key + remove admin-enumeration leak
-- ═══════════════════════════════════════════════════════════════════════════

-- Checks ONLY the calling user — cannot be used to probe other accounts.
CREATE OR REPLACE FUNCTION public.is_current_user_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION public.is_current_user_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_super_admin() TO authenticated;

-- The uid-argument variant lets any authenticated user probe whether an
-- arbitrary uid is an admin. Restrict it to service_role only.
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO service_role;
