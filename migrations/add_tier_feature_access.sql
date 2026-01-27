-- Add tier-based access control columns for all features
-- Admin controls which tiers can access which features

-- Step 1: Add community access column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tier_pricing' AND column_name = 'has_community_access'
    ) THEN
        ALTER TABLE tier_pricing 
        ADD COLUMN has_community_access BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added has_community_access column to tier_pricing table';
    ELSE
        RAISE NOTICE 'has_community_access column already exists';
    END IF;
END $$;

-- Step 2: Add AI mentor access column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tier_pricing' AND column_name = 'has_ai_access'
    ) THEN
        ALTER TABLE tier_pricing 
        ADD COLUMN has_ai_access BOOLEAN DEFAULT false;
        
        RAISE NOTICE 'Added has_ai_access column to tier_pricing table';
    ELSE
        RAISE NOTICE 'has_ai_access column already exists';
    END IF;
END $$;

-- Step 3: Set default values (admin can change these anytime)
-- These are just starting defaults, NOT enforced rules

-- Community: Available for Silver and above (default suggestion)
UPDATE tier_pricing 
SET has_community_access = true 
WHERE tier IN ('silver', 'gold', 'diamond', 'platinum')
AND has_community_access IS NULL;

-- AI Mentor: Available for Gold and above (default suggestion)
UPDATE tier_pricing 
SET has_ai_access = true 
WHERE tier IN ('gold', 'diamond', 'platinum')
AND has_ai_access IS NULL;

-- Step 4: Ensure all tiers have values (set false for others)
UPDATE tier_pricing 
SET has_community_access = COALESCE(has_community_access, false),
    has_ai_access = COALESCE(has_ai_access, false);

-- Step 5: Add comments
COMMENT ON COLUMN tier_pricing.has_community_access IS 'Admin-controlled: Whether this tier can access community features';
COMMENT ON COLUMN tier_pricing.has_ai_access IS 'Admin-controlled: Whether this tier can access AI Mentor';

-- Migration complete
SELECT 'Tier feature access control columns added successfully' AS status;
