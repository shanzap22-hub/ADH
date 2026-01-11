-- Ensure column exists
ALTER TABLE tier_pricing ADD COLUMN IF NOT EXISTS has_booking_access BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE tier_pricing ENABLE ROW LEVEL SECURITY;

-- Allow Public Read (or Authenticated) - pricing is usually public
CREATE POLICY "Public read tier_pricing" ON tier_pricing FOR SELECT USING (true);

-- Allow Super Admin to Update
CREATE POLICY "Super Admin update tier_pricing" ON tier_pricing FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Allow Super Admin to Insert (just in case)
CREATE POLICY "Super Admin insert tier_pricing" ON tier_pricing FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);
