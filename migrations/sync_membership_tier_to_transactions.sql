-- Update sync trigger to include membership_tier
-- This ensures when profile tier changes, transactions also update

CREATE OR REPLACE FUNCTION sync_profile_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all transactions for this user with new profile data
    UPDATE public.transactions
    SET 
        student_email = NEW.email,
        student_name = NEW.full_name,
        whatsapp_number = NEW.whatsapp_number,
        phone_number = NEW.phone_number,
        membership_plan = NEW.membership_tier,  -- NEW: Sync membership tier
        updated_at = NOW()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to watch membership_tier changes
DROP TRIGGER IF EXISTS on_profile_update_sync_transactions ON profiles;

CREATE TRIGGER on_profile_update_sync_transactions
AFTER UPDATE OF email, whatsapp_number, phone_number, full_name, membership_tier
ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_to_transactions();

-- Verify
SELECT 'Trigger updated to sync membership_tier' as status;
