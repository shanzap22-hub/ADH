-- Ensure Realtime is enabled for the chat tables
BEGIN;

-- Check if tables are already in the publication, if not add them.
-- Note: 'supabase_realtime' is the default publication for client-side listening.
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

COMMIT;
