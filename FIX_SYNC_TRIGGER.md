# FIX SYNC ISSUES (Profiles -> Transactions) 🔄

The issue where data becomes "unsynced" is likely because the database function didn't have permission to update the `transactions` table when a student edits their profile.

Run this SQL to create a **Secure Sync Function** that works perfectly.

### **SQL Code to Run:**

```sql
-- 1. Create the Sync Function with SECURITY DEFINER (Critical for Permissions)
CREATE OR REPLACE FUNCTION public.sync_profile_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.transactions
    SET 
        student_name = NEW.full_name,
        student_email = NEW.email,
        whatsapp_number = NEW.whatsapp_number,
        phone_number = NEW.phone_number,
        membership_plan = NEW.membership_tier,
        updated_at = NOW()
    WHERE user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger (Updates whenever profile changes)
DROP TRIGGER IF EXISTS on_profile_update_sync_transactions ON public.profiles;

CREATE TRIGGER on_profile_update_sync_transactions
AFTER UPDATE OF full_name, email, whatsapp_number, phone_number, membership_tier
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_transactions();
```

### **Why this fixes it:**
- **SECURITY DEFINER:** I added this so the function runs with admin privileges. Even if a 'Student' updates their profile, this function has permission to update the 'Transactions' table automatically.
- **Syncs All Fields:** Name, Email, WhatsApp, Phone (Contact Number), and Membership Tier.
