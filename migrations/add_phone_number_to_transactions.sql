-- Add phone_number column to transactions table
-- This allows tracking both WhatsApp number and phone number separately

-- Step 1: Add phone_number column
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Step 2: Migrate existing data (copy from profiles)
UPDATE public.transactions t
SET phone_number = p.phone_number
FROM public.profiles p
WHERE t.user_id = p.id
AND t.phone_number IS NULL;

-- Step 3: Add comment
COMMENT ON COLUMN public.transactions.phone_number IS 'Contact phone number (may differ from WhatsApp number)';

-- Step 4: Update the sync trigger function to include phone_number
CREATE OR REPLACE FUNCTION sync_profile_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all transactions for this user with new profile data
    UPDATE public.transactions
    SET 
        student_email = NEW.email,
        student_name = NEW.full_name,
        whatsapp_number = NEW.whatsapp_number,
        phone_number = NEW.phone_number,  -- NEW: Sync phone number
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Verify the trigger exists (it should already be there)
-- If not, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_profile_update_sync_transactions'
    ) THEN
        CREATE TRIGGER on_profile_update_sync_transactions
        AFTER UPDATE OF email, whatsapp_number, phone_number, full_name 
        ON profiles
        FOR EACH ROW
        EXECUTE FUNCTION sync_profile_to_transactions();
    END IF;
END $$;

-- Step 6: Verify migration
SELECT 
    'Migration Complete' as status,
    COUNT(*) as total_transactions,
    COUNT(phone_number) as transactions_with_phone,
    COUNT(whatsapp_number) as transactions_with_whatsapp
FROM public.transactions;
