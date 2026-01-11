-- Allow users to create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure instructors can also create bookings (if needed, e.g. manual booking)
DROP POLICY IF EXISTS "Instructors create bookings" ON bookings;
CREATE POLICY "Instructors create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = instructor_id);

-- Grant select to public or authenticated users if needed for conflict checking, but stick to RLS for privacy.
-- The API route uses the service role key usually? No, "createClient" in server is strictly scoped to user auth unless using supabaseAdmin.
-- Since the API uses `createClient` which is user-scoped, the INSERT policy is critical.

-- Fix Tier Pricing RLS (Just in case user didn't run the previous fix)
ALTER TABLE tier_pricing ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super Admin update tier_pricing" ON tier_pricing;
CREATE POLICY "Super Admin update tier_pricing" ON tier_pricing FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
