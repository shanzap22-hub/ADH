-- Split Community Access into Feed and Chat, Add Booking Access
-- This migration separates community_access into two distinct features
-- and adds booking access control

-- Step 1: Add new columns
ALTER TABLE tier_pricing 
ADD COLUMN IF NOT EXISTS has_community_feed_access BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_community_chat_access BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_booking_access BOOLEAN DEFAULT true;

-- Step 2: Migrate existing data
-- Copy has_community_access to both new columns
UPDATE tier_pricing 
SET 
  has_community_feed_access = COALESCE(has_community_access, true),
  has_community_chat_access = COALESCE(has_community_access, true);

-- Step 3: Set default values for booking based on tier
-- Bronze: No booking by default
-- Silver/Gold/Platinum: Has booking by default
UPDATE tier_pricing 
SET has_booking_access = false
WHERE tier_name = 'bronze';

UPDATE tier_pricing 
SET has_booking_access = true
WHERE tier_name IN ('silver', 'gold', 'platinum');

-- Step 4: Keep old column for backward compatibility (optional)
-- You can drop it later: ALTER TABLE tier_pricing DROP COLUMN has_community_access;

-- Verify the changes
SELECT 
  tier_name,
  has_community_feed_access,
  has_community_chat_access,
  has_ai_access,
  has_weekly_live_access,
  has_booking_access
FROM tier_pricing
ORDER BY 
  CASE tier_name
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
  END;
