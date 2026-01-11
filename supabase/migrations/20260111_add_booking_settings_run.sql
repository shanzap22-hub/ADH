-- 1. Create table for specific instructor settings
CREATE TABLE IF NOT EXISTS instructor_booking_settings (
    instructor_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    slot_duration INTEGER DEFAULT 30, -- in minutes
    buffer_time INTEGER DEFAULT 5, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE instructor_booking_settings ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Public read settings" ON instructor_booking_settings;
CREATE POLICY "Public read settings" ON instructor_booking_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors update own settings" ON instructor_booking_settings;
CREATE POLICY "Instructors update own settings" ON instructor_booking_settings FOR ALL USING (auth.uid() = instructor_id);
