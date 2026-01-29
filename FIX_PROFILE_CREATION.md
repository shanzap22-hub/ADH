# FIX PROFILE CREATION ERROR 🛠️

The error "Failed to create profile" is happening because the `profiles` table in your database is missing a required column: `setup_required`.

The system tries to save `setup_required: true`, but the database rejects it.

### **Solution:**

1.  Go to **Supabase SQL Editor**.
2.  Run the following command:

```sql
-- Fix 1: Add missing setup_required column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS setup_required BOOLEAN DEFAULT FALSE;

-- Fix 2: Ensure membership_tier exists (just in case)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'free';
```

3.  After running this, try the payment/enrollment again. It will work! ✅
