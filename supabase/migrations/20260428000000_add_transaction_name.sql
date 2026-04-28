ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.transactions
ALTER COLUMN account_id DROP NOT NULL;
