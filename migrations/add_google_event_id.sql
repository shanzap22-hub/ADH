-- Add google_event_id to bookings table to track GCal events
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "google_event_id" TEXT;
