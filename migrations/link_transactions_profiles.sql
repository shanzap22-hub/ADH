-- Add Foreign Key to link transactions to profiles
-- This allows fetching profile data (phone, email) directly with transactions
ALTER TABLE public.transactions
ADD CONSTRAINT fk_transactions_user
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE SET NULL;
