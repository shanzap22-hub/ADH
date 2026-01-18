-- Add min_notice_time column to instructor_booking_settings
-- Default to 60 minutes
ALTER TABLE "instructor_booking_settings" 
ADD COLUMN IF NOT EXISTS "min_notice_time" INTEGER DEFAULT 60;
