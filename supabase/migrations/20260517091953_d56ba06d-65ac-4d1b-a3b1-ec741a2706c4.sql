
CREATE OR REPLACE FUNCTION public.touch_bill_modified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$;
