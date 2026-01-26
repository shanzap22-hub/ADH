-- Migration: Add missing profile columns and unique index for WhatsApp number
-- Ensure idempotent execution

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS setup_required BOOLEAN DEFAULT TRUE;

-- Unique index to prevent duplicate WhatsApp numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles (whatsapp_number);
