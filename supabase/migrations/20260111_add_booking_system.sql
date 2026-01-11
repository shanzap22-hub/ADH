-- Add booking access flag to tier_pricing
ALTER TABLE tier_pricing ADD COLUMN IF NOT EXISTS has_booking_access BOOLEAN DEFAULT FALSE;

-- Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'rescheduled', 'completed')) DEFAULT 'confirmed',
    meeting_link TEXT,
    google_calendar_event_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Availability Policies
CREATE POLICY "Public read availability" ON availability_slots FOR SELECT USING (true);
CREATE POLICY "Instructors manage own slots" ON availability_slots FOR ALL USING (auth.uid() = instructor_id);
CREATE POLICY "Admins manage all slots" ON availability_slots FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Booking Policies
CREATE POLICY "Users view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Instructors view bookings assigned to them" ON bookings FOR SELECT USING (auth.uid() = instructor_id);
CREATE POLICY "Admins view all bookings" ON bookings FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings (cancel/reschedule)" ON bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Instructors can update assigned bookings" ON bookings FOR UPDATE USING (auth.uid() = instructor_id);
