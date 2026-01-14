-- Add has_chat_access column to tier_pricing table
ALTER TABLE tier_pricing 
ADD COLUMN IF NOT EXISTS has_chat_access BOOLEAN DEFAULT TRUE;

-- Update existing rows to have true (preserve current behavior until changed)
UPDATE tier_pricing SET has_chat_access = TRUE WHERE has_chat_access IS NULL;
