-- Add notification tracking to weekly_live_sessions
ALTER TABLE weekly_live_sessions 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS start_notification_sent BOOLEAN DEFAULT FALSE;

-- Add notification tracking to bookings (for 1-on-1 reminders)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
