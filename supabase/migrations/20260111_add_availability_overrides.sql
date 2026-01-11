-- Create availability_overrides table for specific dates
CREATE TABLE IF NOT EXISTS availability_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    specific_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE, -- TRUE = Added slot, FALSE = Blocked day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Overrides
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read overrides" ON availability_overrides FOR SELECT USING (true);
CREATE POLICY "Instructors manage own overrides" ON availability_overrides FOR ALL USING (auth.uid() = instructor_id);
