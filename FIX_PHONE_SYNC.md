# FIX PHONE NUMBER NOT SYNCING 📞

If `phone_number` is not updating in the Transactions table, it means the **Function Logic** inside the database is outdated. It probably skips the phone number line.

Please run this SQL to **Force Update** the function logic:

```sql
CREATE OR REPLACE FUNCTION public.sync_profile_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all fields including phone_number
    UPDATE public.transactions
    SET 
        student_name = NEW.full_name,
        student_email = NEW.email,
        whatsapp_number = NEW.whatsapp_number,
        phone_number = NEW.phone_number, -- This line is crucial
        membership_plan = NEW.membership_tier,
        updated_at = NOW()
    WHERE user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

After running this, changing the Contact Number in your Profile will immediately update the Transactions table.
