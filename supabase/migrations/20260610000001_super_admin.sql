-- ─────────────────────────────────────────────────────────────────────────────
-- Super Admin Role
-- Strategy: admin_roles table checked server-side via service-role key.
-- Regular user RLS policies are NOT changed — admin bypasses via service role.
-- ─────────────────────────────────────────────────────────────────────────────

-- Table tracking which auth.users are super admins
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Only super admins can read/write admin_roles (enforced server-side too)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- No regular user can see or touch this table
-- (Server functions use service-role key which bypasses RLS entirely)
CREATE POLICY "admin_roles_deny_all" ON public.admin_roles
  FOR ALL TO authenticated USING (false);

-- ── Helper function (safe to call from any context) ──────────────────────────
CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = uid);
$$;

-- ── Seed the default super admin (created via Supabase Auth separately) ──────
-- We insert by email lookup so it works after the user signs up.
-- This will no-op if the user doesn't exist yet; run again after first login.
INSERT INTO public.admin_roles (user_id)
SELECT id FROM auth.users WHERE email = 'admin@hamrorent.com'
ON CONFLICT DO NOTHING;
