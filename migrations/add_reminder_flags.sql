-- Add reminder tracking columns to bookings table
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "reminder_3h_sent" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "reminder_30m_sent" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "reminder_5m_sent" BOOLEAN DEFAULT FALSE;
