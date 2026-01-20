-- Remove the old constraint that blocked 'platinum'
ALTER TABLE public.tier_pricing
DROP CONSTRAINT IF EXISTS tier_pricing_tier_check;

-- Add new constraint allowing platinum, expired, cancelled
ALTER TABLE public.tier_pricing
ADD CONSTRAINT tier_pricing_tier_check
CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond', 'platinum', 'expired', 'cancelled'));

-- Now insert the new tiers
INSERT INTO public.tier_pricing (tier, name, price, max_courses, has_booking_access)
VALUES
  ('platinum', 'Platinum', 19999, 999, true),
  ('expired', 'Expired', 0, 0, false),
  ('cancelled', 'Cancelled', 0, 0, false)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  max_courses = EXCLUDED.max_courses;
