-- ============================================
-- TIER FEATURE SPLIT MIGRATION
-- ============================================
-- This migration splits the single "community_access" into two separate features:
-- 1. has_community_feed_access (for /community page)
-- 2. has_community_chat_access (for group chat in /chat)
-- And adds:
-- 3. has_booking_access (for 1-on-1 booking feature)
-- ============================================

-- Step 1: Add new columns to tier_pricing table
ALTER TABLE tier_pricing 
ADD COLUMN IF NOT EXISTS has_community_feed_access BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_community_chat_access BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_booking_access BOOLEAN DEFAULT true;

-- Step 2: Migrate existing data from has_community_access to both new columns
UPDATE tier_pricing 
SET 
  has_community_feed_access = COALESCE(has_community_access, true),
  has_community_chat_access = COALESCE(has_community_access, true)
WHERE has_community_feed_access IS NULL OR has_community_chat_access IS NULL;

-- Step 3: Set booking access based on tier
-- Bronze: No booking by default (can be enabled later)
UPDATE tier_pricing 
SET has_booking_access = false
WHERE tier = 'bronze' AND has_booking_access IS NULL;

-- Silver/Gold/Platinum/Diamond: Has booking by default
UPDATE tier_pricing 
SET has_booking_access = true
WHERE tier IN ('silver', 'gold', 'platinum', 'diamond') AND has_booking_access IS NULL;

-- Expired: No booking
UPDATE tier_pricing 
SET has_booking_access = false
WHERE tier = 'expired' AND has_booking_access IS NULL;

-- Step 4: Verify the migration
SELECT 
  tier,
  name,
  has_community_feed_access AS "Feed",
  has_community_chat_access AS "Chat",
  has_ai_access AS "AI",
  has_weekly_live_access AS "Live",
  has_booking_access AS "Booking"
FROM tier_pricing
ORDER BY 
  CASE tier
    WHEN 'bronze' THEN 1
    WHEN 'silver' THEN 2
    WHEN 'gold' THEN 3
    WHEN 'platinum' THEN 4
    WHEN 'diamond' THEN 5
    WHEN 'expired' THEN 6
  END;

-- ============================================
-- NOTES:
-- - The old has_community_access column is kept for backward compatibility
-- - You can drop it later if needed: ALTER TABLE tier_pricing DROP COLUMN has_community_access;
-- - All existing tiers will have Feed and Chat enabled by default (matching old behavior)
-- - Bronze tier will have Booking disabled by default
-- ============================================
