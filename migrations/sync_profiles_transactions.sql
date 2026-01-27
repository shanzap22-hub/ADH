-- Function to sync profile changes to transactions table
CREATE OR REPLACE FUNCTION public.sync_profile_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update transactions where user_id matches the updated profile
    UPDATE public.transactions
    SET 
        email = NEW.email,
        whatsapp_number = NEW.whatsapp_number, -- Distinct WhatsApp Number
        student_name = NEW.full_name,
        updated_at = NOW()
    WHERE user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire after profile update
DROP TRIGGER IF EXISTS on_profile_update_sync_transactions ON public.profiles;

CREATE TRIGGER on_profile_update_sync_transactions
AFTER UPDATE OF email, whatsapp_number, full_name
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_transactions();
