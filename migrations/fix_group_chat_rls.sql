-- Fix: Ensure Group Chat RLS Policies are Applied
-- This ensures users can see messages in group chats even if they're not in participant_ids

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON chat_messages;

-- Recreate policies with Group Chat support
CREATE POLICY "Users can view own or group conversations"
ON chat_conversations FOR SELECT
USING (
    (auth.uid() = ANY(participant_ids)) OR (is_group = true)
);

CREATE POLICY "Users can view messages in own or group conversations"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
            (auth.uid() = ANY(chat_conversations.participant_ids))
            OR
            (chat_conversations.is_group = true)
        )
    )
);

CREATE POLICY "Users can insert messages in own or group conversations"
ON chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND (
            (auth.uid() = ANY(chat_conversations.participant_ids))
            OR
            (chat_conversations.is_group = true)
        )
    )
    AND auth.uid() = sender_id
);

-- Verify the Community Chat group exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM chat_conversations WHERE is_group = true AND group_name = 'Community Chat') THEN
        INSERT INTO chat_conversations (is_group, group_name, participant_ids)
        VALUES (true, 'Community Chat', '{}');
        RAISE NOTICE 'Created Community Chat group';
    ELSE
        RAISE NOTICE 'Community Chat group already exists';
    END IF;
END $$;
