-- Add Terms and Conditions acceptance flags to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_ai_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_community_accepted BOOLEAN DEFAULT FALSE;

-- Optional: Add timestamps if needed for legal audit
-- ALTER TABLE profiles ADD COLUMN terms_ai_accepted_at TIMESTAMPTZ;
-- ALTER TABLE profiles ADD COLUMN terms_community_accepted_at TIMESTAMPTZ;
