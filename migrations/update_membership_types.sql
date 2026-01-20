-- OPTIONAL: Run this logic in Supabase SQL Editor if you have database-level constraints

-- 1. If you are using a CHECK Entry on the profiles table, update it:
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_membership_tier_check 
CHECK (membership_tier IN ('bronze', 'silver', 'gold', 'diamond', 'platinum', 'expired', 'cancelled'));

-- 2. If you are using an ENUM type, add the new values:
-- (Uncomment if needed)
-- ALTER TYPE membership_tier_enum ADD VALUE IF NOT EXISTS 'platinum';
-- ALTER TYPE membership_tier_enum ADD VALUE IF NOT EXISTS 'expired';
-- ALTER TYPE membership_tier_enum ADD VALUE IF NOT EXISTS 'cancelled';
