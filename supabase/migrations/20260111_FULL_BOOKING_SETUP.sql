-- 1. Add Booking Access Flag to Tier Pricing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tier_pricing' AND column_name = 'has_booking_access') THEN 
        ALTER TABLE tier_pricing ADD COLUMN has_booking_access BOOLEAN DEFAULT FALSE; 
    END IF; 
END $$;

-- 2. Create Availability Slots Table
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), 
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Bookings Table
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

-- 4. Create Availability Overrides Table (Specific Dates)
CREATE TABLE IF NOT EXISTS availability_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    specific_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE tier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

-- 6. Policies

-- Tier Pricing Policies
DROP POLICY IF EXISTS "Public read tier_pricing" ON tier_pricing;
CREATE POLICY "Public read tier_pricing" ON tier_pricing FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super Admin update tier_pricing" ON tier_pricing;
CREATE POLICY "Super Admin update tier_pricing" ON tier_pricing FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
);

-- Availability Slots Policies
DROP POLICY IF EXISTS "Public read availability" ON availability_slots;
CREATE POLICY "Public read availability" ON availability_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors manage own slots" ON availability_slots;
CREATE POLICY "Instructors manage own slots" ON availability_slots FOR ALL USING (auth.uid() = instructor_id);

-- Availability Overrides Policies
DROP POLICY IF EXISTS "Public read overrides" ON availability_overrides;
CREATE POLICY "Public read overrides" ON availability_overrides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors manage own overrides" ON availability_overrides;
CREATE POLICY "Instructors manage own overrides" ON availability_overrides FOR ALL USING (auth.uid() = instructor_id);

-- Bookings Policies
DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
CREATE POLICY "Users view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors view bookings assigned to them" ON bookings;
CREATE POLICY "Instructors view bookings assigned to them" ON bookings FOR SELECT USING (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors create bookings" ON bookings;
CREATE POLICY "Instructors create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = instructor_id);

DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
CREATE POLICY "Users can cancel own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Instructors can update assigned bookings" ON bookings;
CREATE POLICY "Instructors can update assigned bookings" ON bookings FOR UPDATE USING (auth.uid() = instructor_id);
