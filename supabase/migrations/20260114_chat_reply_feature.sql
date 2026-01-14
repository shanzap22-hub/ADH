-- Add reply_to_id column to chat_messages table
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_id);
