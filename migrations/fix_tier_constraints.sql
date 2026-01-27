-- Fix Tier System: Add Platinum, Expired, and Cancelled tiers
-- This migration updates the CHECK constraints and adds missing tiers

-- Step 1: Drop existing CHECK constraint on profiles.membership_tier
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_tier_check;

-- Step 2: Add new CHECK constraint with all tiers including platinum, expired, cancelled
ALTER TABLE profiles 
ADD CONSTRAINT profiles_membership_tier_check 
CHECK (membership_tier IN ('free', 'bronze', 'silver', 'gold', 'diamond', 'platinum', 'expired', 'cancelled'));

-- Step 3: Drop existing CHECK constraint on course_tier_access.tier
ALTER TABLE course_tier_access DROP CONSTRAINT IF EXISTS course_tier_access_tier_check;

-- Step 4: Add new CHECK constraint for course_tier_access with all tiers
ALTER TABLE course_tier_access 
ADD CONSTRAINT course_tier_access_tier_check 
CHECK (tier IN ('free', 'bronze', 'silver', 'gold', 'diamond', 'platinum', 'expired'));

-- Step 5: Drop existing CHECK constraint on tier_pricing.tier
ALTER TABLE tier_pricing DROP CONSTRAINT IF EXISTS tier_pricing_tier_check;

-- Step 6: Add new CHECK constraint for tier_pricing
ALTER TABLE tier_pricing 
ADD CONSTRAINT tier_pricing_tier_check 
CHECK (tier IN ('free', 'bronze', 'silver', 'gold', 'diamond', 'platinum', 'expired', 'cancelled'));

-- Step 7: Insert/Update Platinum tier pricing
-- NOTE: These are DEFAULT values only. Admin can customize max_courses anytime via dashboard.
INSERT INTO tier_pricing (tier, price, name, description, max_courses, features, has_booking_access) VALUES
('platinum', 19999, 'Platinum', 'Ultimate access - Admin customizable', 999, 
 '["Fully customizable by admin", "VIP support", "All premium features"]'::jsonb,
 true)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW()
    -- NOTE: NOT updating price, max_courses, features on conflict - preserves admin customizations
WHERE tier_pricing.tier = 'platinum' AND tier_pricing.price IS NULL;

-- Step 8: Insert/Update Expired tier (for display purposes)
INSERT INTO tier_pricing (tier, price, name, description, max_courses, features, is_active, has_booking_access) VALUES
('expired', 0, 'Expired', 'Membership has expired', 0, 
 '["No course access", "Renew to continue"]'::jsonb,
 false,
 false)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW()
WHERE tier_pricing.tier = 'expired' AND tier_pricing.price IS NULL;

-- Step 9: Insert/Update Cancelled tier (for admin tracking)
INSERT INTO tier_pricing (tier, price, name, description, max_courses, features, is_active, has_booking_access) VALUES
('cancelled', 0, 'Cancelled', 'Membership cancelled by admin', 0, 
 '["No access", "Contact support"]'::jsonb,
 false,
 false)
ON CONFLICT (tier) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW()
WHERE tier_pricing.tier = 'cancelled' AND tier_pricing.price IS NULL;

-- Step 9b: Add Free tier if not exists (admin can customize)
INSERT INTO tier_pricing (tier, price, name, description, max_courses, features, is_active, has_booking_access) VALUES
('free', 0, 'Free', 'Free tier - Admin customizable', 1, 
 '["Customizable by admin"]'::jsonb,
 true,
 false)
ON CONFLICT (tier) DO NOTHING;  -- Don't overwrite if already exists

-- Step 10: Update tier hierarchy function to include platinum
CREATE OR REPLACE FUNCTION get_user_tier_hierarchy(user_tier TEXT)
RETURNS TEXT[] AS $$
BEGIN
    -- Platinum gets all tiers
    IF user_tier = 'platinum' THEN
        RETURN ARRAY['free', 'bronze', 'silver', 'gold', 'diamond', 'platinum'];
    -- Diamond gets all except platinum
    ELSIF user_tier = 'diamond' THEN
        RETURN ARRAY['free', 'bronze', 'silver', 'gold', 'diamond'];
    -- Gold gets bronze, silver, gold
    ELSIF user_tier = 'gold' THEN
        RETURN ARRAY['free', 'bronze', 'silver', 'gold'];
    -- Silver gets bronze, silver
    ELSIF user_tier = 'silver' THEN
        RETURN ARRAY['free', 'bronze', 'silver'];
    -- Bronze gets only bronze
    ELSIF user_tier = 'bronze' THEN
        RETURN ARRAY['free', 'bronze'];
    -- Free tier gets only free courses
    ELSIF user_tier = 'free' THEN
        RETURN ARRAY['free'];
    -- Expired and Cancelled get nothing
    ELSE
        RETURN ARRAY[]::TEXT[];
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 11: Add comment
COMMENT ON CONSTRAINT profiles_membership_tier_check ON profiles IS 'Supports: free, bronze, silver, gold, diamond, platinum, expired, cancelled';
COMMENT ON CONSTRAINT course_tier_access_tier_check ON course_tier_access IS 'Supports: free, bronze, silver, gold, diamond, platinum, expired (no cancelled for courses)';

-- Migration complete
SELECT 'Tier system updated successfully with Platinum, Expired, and Cancelled tiers' AS status;
