-- ===================================================
-- DYNAMIC MEMBERSHIP TIERS MIGRATION
-- ===================================================
-- Drops strict CHECK constraints restricting tier values
-- and establishes proper foreign keys with ON UPDATE CASCADE
-- to allow dynamic adding, renaming, and deleting of tiers.
-- ===================================================

-- Step 1: Drop existing CHECK constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;
ALTER TABLE public.course_tier_access DROP CONSTRAINT IF EXISTS course_tier_access_tier_check;
ALTER TABLE public.tier_pricing DROP CONSTRAINT IF EXISTS tier_pricing_tier_check;

-- Step 2: Add FOREIGN KEY constraint on course_tier_access.tier referencing tier_pricing.tier
ALTER TABLE public.course_tier_access DROP CONSTRAINT IF EXISTS course_tier_access_tier_fkey;
ALTER TABLE public.course_tier_access
ADD CONSTRAINT course_tier_access_tier_fkey 
FOREIGN KEY (tier) REFERENCES public.tier_pricing(tier) 
ON UPDATE CASCADE ON DELETE CASCADE;

-- Step 3: Add FOREIGN KEY constraint on profiles.membership_tier referencing tier_pricing.tier
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_fkey;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_membership_tier_fkey 
FOREIGN KEY (membership_tier) REFERENCES public.tier_pricing(tier) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- Step 4: Add comment documenting changes
COMMENT ON COLUMN public.tier_pricing.tier IS 'Primary key slug. Cascades updates to profiles and course_tier_access.';
