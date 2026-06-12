-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-property support
--
-- Adds a `properties` table that sits ABOVE `tenants`, so a landlord with more
-- than one building can group tenants by property. `tenants.property_id` is a
-- NULLABLE foreign key — existing tenants are unaffected and simply show as
-- "Ungrouped" until assigned. ON DELETE SET NULL means deleting a property
-- never deletes its tenants; they fall back to ungrouped.
--
-- Security model mirrors `tenants`: owner-scoped RLS on every operation, with
-- explicit grants to the `authenticated` role. owner_id defaults to auth.uid()
-- and the WITH CHECK clauses prevent inserting/updating rows for another user.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_owner_idx ON public.properties(owner_id);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;

DROP POLICY IF EXISTS "properties_select_own" ON public.properties;
CREATE POLICY "properties_select_own" ON public.properties
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_insert_own" ON public.properties;
CREATE POLICY "properties_insert_own" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_update_own" ON public.properties;
CREATE POLICY "properties_update_own" ON public.properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "properties_delete_own" ON public.properties;
CREATE POLICY "properties_delete_own" ON public.properties
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Link tenants → properties (nullable; existing rows stay ungrouped).
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS property_id uuid
  REFERENCES public.properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tenants_property_idx ON public.tenants(property_id);
