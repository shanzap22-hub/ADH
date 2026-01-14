-- Run this in Supabase SQL Editor to fix the issue

-- 1. Check if reply_to_id column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
AND column_name = 'reply_to_id';

-- 2. If not exists, add it
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_id);

-- 4. Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'chat_messages'
ORDER BY ordinal_position;
