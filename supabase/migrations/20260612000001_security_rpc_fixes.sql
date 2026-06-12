-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY: RPC hardening — two genuinely new scanner findings
-- Idempotent. Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── FIX 1 (CRITICAL): Subscription tier enumerable via get_tenant_slots ───────
--
-- PROBLEM: get_tenant_slots(uid uuid) accepts any UUID from the caller.
-- An authenticated user can call:
--   supabase.rpc('get_tenant_slots', { uid: '<victim_uuid>' })
-- and learn the victim's tenant_slots value, revealing their subscription tier.
--
-- FIX: Replace the uid parameter with auth.uid() internally.
-- The function now IGNORES any caller-supplied uid for the subscription lookup
-- and only ever reads the authenticated caller's own row.
-- The trigger (enforce_tenant_slot_limit) calls it with NEW.owner_id, which
-- runs as SECURITY DEFINER so auth.uid() is the row owner — also safe.
--
-- The external signature keeps `uid uuid` so existing call sites compile,
-- but the parameter is silently ignored in favour of auth.uid() when called
-- by an authenticated user. For trigger context (where auth.uid() is null),
-- we fall back to the supplied uid — this is safe because the trigger only
-- fires for the authenticated user's own INSERT/UPDATE via RLS.

CREATE OR REPLACE FUNCTION public.get_tenant_slots(uid uuid DEFAULT NULL)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT CASE
       WHEN s.status <> 'active' THEN 0
       WHEN s.expires_at IS NOT NULL AND s.expires_at < now() THEN 3
       ELSE s.tenant_slots
     END
     FROM public.subscriptions s
     -- Use auth.uid() when available (normal RPC calls from authenticated users).
     -- Fall back to the supplied uid only when auth.uid() is null, which only
     -- happens in trigger context (SECURITY DEFINER trigger calling this fn).
     WHERE s.user_id = COALESCE(auth.uid(), uid)),
    3  -- no subscription row → free tier default
  );
$$;

-- Re-assert grants (idempotent)
REVOKE ALL ON FUNCTION public.get_tenant_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_slots(uuid) TO authenticated;
-- Trigger function needs to call it too (runs as definer, not as authenticated)
GRANT EXECUTE ON FUNCTION public.get_tenant_slots(uuid) TO service_role;
