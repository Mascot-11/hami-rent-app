-- ═══════════════════════════════════════════════════════════════════════════
-- SUBSCRIPTIONS (manual payments) + TENANT SLOT ALLOCATION + APP SETTINGS (ads)
-- Idempotent. Admin writes happen ONLY via service-role (server functions).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Subscriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan         text NOT NULL DEFAULT 'free'
               CHECK (plan IN ('free','basic','pro','custom')),
  status       text NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','expired','suspended')),
  tenant_slots integer NOT NULL DEFAULT 3
               CHECK (tenant_slots >= 0 AND tenant_slots <= 10000),
  expires_at   timestamptz,
  notes        text,
  updated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscriptions FROM anon;
REVOKE ALL ON public.subscriptions FROM PUBLIC;
GRANT SELECT ON public.subscriptions TO authenticated;

DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE policies for authenticated → writes are
-- service-role only (super admin server functions).

-- ── 2. Manual subscription payments (audit trail) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_npr  numeric(12,2) NOT NULL CHECK (amount_npr >= 0 AND amount_npr <= 100000000),
  method      text NOT NULL DEFAULT 'manual'
              CHECK (method IN ('manual','cash','bank_transfer','esewa','khalti','other')),
  reference   text,
  note        text,
  period_from date,
  period_to   date,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  paid_at     timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_user ON public.subscription_payments(user_id);

ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_payments FROM anon;
REVOKE ALL ON public.subscription_payments FROM PUBLIC;
GRANT SELECT ON public.subscription_payments TO authenticated;

DROP POLICY IF EXISTS "sub_payments_select_own" ON public.subscription_payments;
CREATE POLICY "sub_payments_select_own" ON public.subscription_payments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Writes: service-role only.

-- ── 3. App settings (ads config, etc.) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_settings FROM anon;
REVOKE ALL ON public.app_settings FROM authenticated;
REVOKE ALL ON public.app_settings FROM PUBLIC;
-- DENY ALL: read/written exclusively through server functions (service role).
-- The public ads endpoint sanitizes output server-side.

INSERT INTO public.app_settings (key, value)
VALUES ('ads', '{"enabled": false, "provider": "adsense", "client_id": "", "slot_dashboard": "", "slot_landing": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── 4. Helper: allocated slots for a user (defaults to 3 = free plan) ────────
CREATE OR REPLACE FUNCTION public.get_tenant_slots(uid uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT CASE
       WHEN s.status <> 'active' THEN 0
       WHEN s.expires_at IS NOT NULL AND s.expires_at < now() THEN 3  -- lapsed → free tier
       ELSE s.tenant_slots
     END
     FROM public.subscriptions s WHERE s.user_id = uid),
    3  -- no subscription row → free tier default
  );
$$;

REVOKE ALL ON FUNCTION public.get_tenant_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tenant_slots(uuid) TO authenticated;

-- ── 5. DB-level slot enforcement (defense in depth) ──────────────────────────
-- Even if the app layer is bypassed, the database refuses inserts/reactivations
-- beyond the allocated slot count. Counts ACTIVE tenants only.
CREATE OR REPLACE FUNCTION public.enforce_tenant_slot_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
  allowed      integer;
BEGIN
  -- Only enforce when the row will be active
  IF COALESCE(NEW.is_active, true) = false THEN
    RETURN NEW;
  END IF;
  -- Updates that don't activate a tenant pass through
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.is_active, true) = true THEN
    RETURN NEW;
  END IF;

  allowed := public.get_tenant_slots(NEW.owner_id);

  SELECT count(*) INTO active_count
  FROM public.tenants
  WHERE owner_id = NEW.owner_id
    AND is_active = true
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_count >= allowed THEN
    RAISE EXCEPTION 'Tenant slot limit reached (% of % used). Contact admin to upgrade your plan.',
      active_count, allowed
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_tenant_slots ON public.tenants;
CREATE TRIGGER trg_enforce_tenant_slots
  BEFORE INSERT OR UPDATE OF is_active ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.enforce_tenant_slot_limit();

-- ── 6. updated_at maintenance ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_subscriptions_touch ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_touch
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
