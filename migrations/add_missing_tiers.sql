-- Add Platinum, Expired, and Cancelled to tier_pricing table
-- This ensures they appear in the Admin Dashboard Cards, Booking Feature List, and Feature Control list.

INSERT INTO public.tier_pricing (tier, name, price, max_courses, has_booking_access)
VALUES
  ('platinum', 'Platinum', 19999, 999, true),
  ('expired', 'Expired', 0, 0, false),
  ('cancelled', 'Cancelled', 0, 0, false)
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  max_courses = EXCLUDED.max_courses;
