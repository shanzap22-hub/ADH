-- Add notifications_last_cleared_at to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notifications_last_cleared_at TIMESTAMP WITH TIME ZONE;
