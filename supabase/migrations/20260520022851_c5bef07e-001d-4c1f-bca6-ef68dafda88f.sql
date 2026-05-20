ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS bills_share_token_idx ON public.bills(share_token);