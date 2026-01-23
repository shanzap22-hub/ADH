-- Create table for One-on-One Session Settings
CREATE TABLE IF NOT EXISTS one_on_one_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    banner_url TEXT,
    title TEXT DEFAULT '1-on-1 Strategy Call',
    features JSONB DEFAULT '["Meta & Social Media Strategy", "Automation & AI Setup", "Personal Branding Blueprint"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE one_on_one_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access" ON one_on_one_settings
    FOR SELECT USING (true);

CREATE POLICY "Instructor/Admin update access" ON one_on_one_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.role = 'instructor' OR profiles.role = 'super_admin')
        )
    );
