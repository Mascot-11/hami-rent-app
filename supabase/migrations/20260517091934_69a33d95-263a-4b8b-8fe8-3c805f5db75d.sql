
-- Enums
CREATE TYPE public.electricity_mode AS ENUM ('per_unit', 'direct');
CREATE TYPE public.payment_method AS ENUM ('cash', 'bank', 'esewa', 'khalti', 'other');

-- Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  room_number text,
  phone text,
  move_in_date_bs text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tenants_owner_idx ON public.tenants(owner_id);

-- Bills
CREATE TABLE public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bs_year int NOT NULL CHECK (bs_year BETWEEN 2070 AND 2100),
  bs_month int NOT NULL CHECK (bs_month BETWEEN 1 AND 12),
  rent_this_month numeric(12,2) NOT NULL DEFAULT 0 CHECK (rent_this_month >= 0),
  water_bill numeric(12,2) NOT NULL DEFAULT 0 CHECK (water_bill >= 0),
  electricity_mode public.electricity_mode NOT NULL DEFAULT 'direct',
  electricity_prev_reading numeric(12,2),
  electricity_curr_reading numeric(12,2),
  electricity_rate_snapshot numeric(12,4),
  electricity_service_charge numeric(12,2) NOT NULL DEFAULT 0 CHECK (electricity_service_charge >= 0),
  electricity_direct_amount numeric(12,2),
  carry_forward_credit numeric(12,2) NOT NULL DEFAULT 0 CHECK (carry_forward_credit >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_modified_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, bs_year, bs_month)
);
CREATE INDEX bills_owner_idx ON public.bills(owner_id);
CREATE INDEX bills_tenant_idx ON public.bills(tenant_id);
CREATE INDEX bills_year_month_idx ON public.bills(bs_year, bs_month);

-- Additional charges
CREATE TABLE public.additional_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(trim(label)) > 0),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX additional_charges_bill_idx ON public.additional_charges(bill_id);
CREATE INDEX additional_charges_owner_idx ON public.additional_charges(owner_id);

-- Payments
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  payment_date_bs text NOT NULL,
  amount_paid numeric(12,2) NOT NULL CHECK (amount_paid > 0),
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX payments_bill_idx ON public.payments(bill_id);
CREATE INDEX payments_owner_idx ON public.payments(owner_id);

-- Keep last_modified_at fresh on bill update
CREATE OR REPLACE FUNCTION public.touch_bill_modified()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER bills_touch_modified
BEFORE UPDATE ON public.bills
FOR EACH ROW EXECUTE FUNCTION public.touch_bill_modified();

-- RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "tenants_select_own" ON public.tenants FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "tenants_insert_own" ON public.tenants FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_update_own" ON public.tenants FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "tenants_delete_own" ON public.tenants FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Bills policies
CREATE POLICY "bills_select_own" ON public.bills FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "bills_insert_own" ON public.bills FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "bills_update_own" ON public.bills FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "bills_delete_own" ON public.bills FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Additional charges policies
CREATE POLICY "charges_select_own" ON public.additional_charges FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "charges_insert_own" ON public.additional_charges FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "charges_update_own" ON public.additional_charges FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "charges_delete_own" ON public.additional_charges FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Payments policies
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "payments_update_own" ON public.payments FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "payments_delete_own" ON public.payments FOR DELETE TO authenticated USING (owner_id = auth.uid());
