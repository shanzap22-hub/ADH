-- Create function to sync profile changes to payments_temp table
CREATE OR REPLACE FUNCTION sync_profile_to_payments_temp()
RETURNS TRIGGER AS $$
BEGIN
    -- Update WhatsApp Number in payments_temp if the user has a pending payment
    -- Note: payments_temp does NOT have user_id, but we can match by whatsapp_number (if reliable)
    -- OR better: Since payments_temp is temporary for drop-offs (guests), we usually don't have a linked user_id.
    
    -- However, if we assume the whatsapp_number is the key identifier:
    -- If profile whatsapp number changes, and the old whatsapp number was in payments_temp, 
    -- we update it to the new one.
    
    -- BUT WAIT: If we update profile, how do we know which row in payments_temp belongs to this user?
    -- payments_temp table does not store user_id or email, only whatsapp_number.
    -- If I change my whatsapp from A to B in profile, how does the system know that 'entry with A' in payments_temp belongs to me?
    -- It matches 'A'. 
    
    IF OLD.whatsapp_number IS NOT NULL AND OLD.whatsapp_number != NEW.whatsapp_number THEN
        UPDATE public.payments_temp
        SET whatsapp_number = NEW.whatsapp_number
        WHERE whatsapp_number = OLD.whatsapp_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Create Trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_update_sync_payments_temp ON profiles;

CREATE TRIGGER on_profile_update_sync_payments_temp
AFTER UPDATE OF whatsapp_number
ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_profile_to_payments_temp();
