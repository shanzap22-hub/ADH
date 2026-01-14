-- Fix Chat Identity Persistence Issue

-- The issue is that the join between chat_messages and profiles is fragile without a direct Foreign Key.
-- This SQL adds a direct Foreign Key constraint from chat_messages.sender_id to profiles.id.
-- This allows PostgREST (Supabase) to reliably join these tables and fetch user names.

-- 1. Add Foreign Key Constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_sender_id_fkey_profiles') THEN
        ALTER TABLE chat_messages
        ADD CONSTRAINT chat_messages_sender_id_fkey_profiles
        FOREIGN KEY (sender_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Verify the join works (Test Query)
SELECT 
    cm.id,
    cm.content,
    p.full_name
FROM chat_messages cm
JOIN profiles p ON cm.sender_id = p.id
LIMIT 5;

-- 3. If the above fails due to missing profiles for some messages, those messages might need to be cleaned up
-- or profiles created. But usually CASCADE handles deletes.
