-- Add reply_to_id to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL;

-- Enable Realtime for this new column? 
-- (Supabase Realtime listens to the table, so adding a column usually just works, 
-- but sometimes clients need a restart or explicit selection if they select specific columns)
