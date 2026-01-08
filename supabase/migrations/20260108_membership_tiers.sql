-- Add membership_tier column to profiles table
-- This migration adds support for Bronze, Silver, Gold, and Diamond membership tiers

-- Step 1: Add membership_tier column with default 'bronze'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'membership_tier'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN membership_tier TEXT DEFAULT 'bronze' 
        CHECK (membership_tier IN ('bronze', 'silver', 'gold', 'diamond'));
        
        RAISE NOTICE 'Added membership_tier column to profiles table';
    ELSE
        RAISE NOTICE 'membership_tier column already exists';
    END IF;
END $$;

-- Step 2: Create index for faster tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_membership_tier ON profiles(membership_tier);

-- Step 3: Create course_tier_access table
-- Maps which courses are available for each tier
CREATE TABLE IF NOT EXISTS course_tier_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, tier)
);

-- Create indexes for course_tier_access
CREATE INDEX IF NOT EXISTS idx_course_tier_access_course ON course_tier_access(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tier_access_tier ON course_tier_access(tier);

-- Step 4: Create tier_pricing table
-- Stores pricing and features for each tier
CREATE TABLE IF NOT EXISTS tier_pricing (
    tier TEXT PRIMARY KEY CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond')),
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    name TEXT NOT NULL,
    description TEXT,
    features JSONB,
    max_courses INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Insert default tier pricing
INSERT INTO tier_pricing (tier, price, name, description, max_courses, features) VALUES
('bronze', 0, 'Bronze', 'Free tier with limited access', 1, '["Access to 1 course", "Community support", "Basic features"]'::jsonb),
('silver', 4999, 'Silver', 'Access to curated courses', 8, '["Access to 8 courses", "Priority support", "All basic features", "Course certificates"]'::jsonb),
('gold', 9999, 'Gold', 'Premium access to most courses', 11, '["Access to 11 courses", "Premium support", "All features", "Course certificates", "Exclusive content"]'::jsonb),
('diamond', 14999, 'Diamond', 'Full access to all courses', 999, '["Access to ALL courses", "VIP support", "All premium features", "Course certificates", "Exclusive content", "1-on-1 mentoring"]'::jsonb)
ON CONFLICT (tier) DO UPDATE SET
    price = EXCLUDED.price,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    max_courses = EXCLUDED.max_courses,
    features = EXCLUDED.features,
    updated_at = NOW();

-- Step 6: Create RLS policies for course_tier_access
ALTER TABLE course_tier_access ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read tier access (needed to check course availability)
CREATE POLICY "Anyone can view course tier access"
    ON course_tier_access FOR SELECT
    USING (true);

-- Only super admins can modify tier access
CREATE POLICY "Super admins can manage course tier access"
    ON course_tier_access FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Step 7: Create RLS policies for tier_pricing
ALTER TABLE tier_pricing ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read tier pricing
CREATE POLICY "Anyone can view tier pricing"
    ON tier_pricing FOR SELECT
    USING (is_active = true);

-- Only super admins can modify tier pricing
CREATE POLICY "Super admins can manage tier pricing"
    ON tier_pricing FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Step 8: Create helper function to get user's accessible courses
CREATE OR REPLACE FUNCTION get_user_tier_hierarchy(user_tier TEXT)
RETURNS TEXT[] AS $$
BEGIN
    -- Diamond gets all tiers
    IF user_tier = 'diamond' THEN
        RETURN ARRAY['bronze', 'silver', 'gold', 'diamond'];
    -- Gold gets bronze, silver, gold
    ELSIF user_tier = 'gold' THEN
        RETURN ARRAY['bronze', 'silver', 'gold'];
    -- Silver gets bronze, silver
    ELSIF user_tier = 'silver' THEN
        RETURN ARRAY['bronze', 'silver'];
    -- Bronze gets only bronze
    ELSE
        RETURN ARRAY['bronze'];
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 9: Update existing users to bronze tier (if not already set)
UPDATE profiles 
SET membership_tier = 'bronze' 
WHERE membership_tier IS NULL;

-- Step 10: Add updated_at trigger for tier_pricing
CREATE OR REPLACE FUNCTION update_tier_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tier_pricing_updated_at
    BEFORE UPDATE ON tier_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_tier_pricing_updated_at();

-- Step 11: Add updated_at trigger for course_tier_access
CREATE OR REPLACE FUNCTION update_course_tier_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_tier_access_updated_at
    BEFORE UPDATE ON course_tier_access
    FOR EACH ROW
    EXECUTE FUNCTION update_course_tier_access_updated_at();

COMMENT ON TABLE course_tier_access IS 'Maps courses to membership tiers - determines which courses are available for each tier';
COMMENT ON TABLE tier_pricing IS 'Stores pricing and configuration for each membership tier';
COMMENT ON COLUMN profiles.membership_tier IS 'User membership tier: bronze (free), silver, gold, or diamond';
