-- Fix Platinum Price to be lower than Diamond
-- Current: Platinum (19999) > Diamond (14999)
-- Required: Gold (9999) < Platinum < Diamond (14999)
-- Setting Platinum to 12999

UPDATE public.tier_pricing
SET price = 12999
WHERE tier = 'platinum';
