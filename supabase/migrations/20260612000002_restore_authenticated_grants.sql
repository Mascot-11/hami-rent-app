-- ═══════════════════════════════════════════════════════════════════════════
-- HOTFIX: Restore authenticated user grants on core tables
-- The security hardening migration ran REVOKE ALL FROM PUBLIC which also
-- stripped grants inherited by the `authenticated` role. RLS policies exist
-- and are correct, but without table-level GRANT the queries return nothing
-- (bills return "Bill not found", tenants upsert fails, etc.)
-- ═══════════════════════════════════════════════════════════════════════════

-- Core app tables — authenticated users need full CRUD (RLS restricts to own rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.additional_charges TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments           TO authenticated;

-- Subscriptions — read-only for authenticated (writes are service-role only)
GRANT SELECT ON public.subscriptions         TO authenticated;
GRANT SELECT ON public.subscription_payments TO authenticated;

-- app_settings stays DENY ALL for authenticated — service role only
-- admin_roles stays DENY ALL for authenticated — service role only

-- Sequences (needed for serial/bigserial PKs if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
