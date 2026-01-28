-- FUNCTION: Link existing transactions to a newly created/updated profile based on Email or Phone
-- This solves the issue where Guest Checkout (adh.pending email) transactions are not linked to the user when they finally Sign Up.

CREATE OR REPLACE FUNCTION link_transactions_to_new_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Link by Email (If email matches and user_id is NULL)
    UPDATE public.transactions
    SET 
        user_id = NEW.id,
        student_email = NEW.email, -- Auto-fix email
        student_name = NEW.full_name -- Auto-fix name
    WHERE 
        (student_email = NEW.email OR student_email LIKE NEW.email)
        AND user_id IS NULL;

    -- 2. Link by Phone Number (If phone matches and user_id is NULL)
    IF NEW.phone_number IS NOT NULL THEN
        UPDATE public.transactions
        SET 
            user_id = NEW.id,
            student_email = NEW.email,
            student_name = NEW.full_name,
            phone_number = NEW.phone_number
        WHERE 
            phone_number = NEW.phone_number 
            AND user_id IS NULL;
    END IF;

    -- 3. Link by WhatsApp Number (If whatsapp matches and user_id is NULL)
    IF NEW.whatsapp_number IS NOT NULL THEN
        UPDATE public.transactions
        SET 
            user_id = NEW.id,
            student_email = NEW.email,
            student_name = NEW.full_name,
            whatsapp_number = NEW.whatsapp_number
        WHERE 
            whatsapp_number = NEW.whatsapp_number 
            AND user_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CREATE TRIGGER
-- Run this trigger EVERY TIME a profile is Inserted or Updated.
-- This ensures even if they update their phone later, we find their old lost transactions.

DROP TRIGGER IF EXISTS on_profile_link_transactions ON profiles;

CREATE TRIGGER on_profile_link_transactions
AFTER INSERT OR UPDATE
ON profiles
FOR EACH ROW
EXECUTE FUNCTION link_transactions_to_new_profile();
