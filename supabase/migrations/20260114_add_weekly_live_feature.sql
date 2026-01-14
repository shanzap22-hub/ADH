-- 1. Add Access Control Column to Tier Pricing
ALTER TABLE tier_pricing 
ADD COLUMN IF NOT EXISTS has_weekly_live_access BOOLEAN DEFAULT TRUE;

UPDATE tier_pricing SET has_weekly_live_access = TRUE WHERE has_weekly_live_access IS NULL;

-- 2. Create Weekly Live Sessions Table
CREATE TABLE IF NOT EXISTS weekly_live_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT,
    description TEXT,
    banner_url TEXT,
    join_url TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS Policies
ALTER TABLE weekly_live_sessions ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Authenticated users can view sessions" ON weekly_live_sessions
    FOR SELECT TO authenticated USING (true);

-- Allow Admins and Instructors to manage sessions
CREATE POLICY "Instructors and Admins can manage sessions" ON weekly_live_sessions
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'instructor' OR profiles.role = 'super_admin' OR profiles.role = 'admin')
        )
    );
