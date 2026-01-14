-- Fix chat_messages relationship to allow joining with profiles
ALTER TABLE chat_messages
DROP CONSTRAINT chat_messages_sender_id_fkey;

ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- Also fix chat_conversations if needed, but array relationships are different.
-- Ensure RLS policies are not broken by this (they check auth.uid() which is fine as profiles.id == auth.uid())

-- Verify Realtime is still enabled (it is, but good to ensure)
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
