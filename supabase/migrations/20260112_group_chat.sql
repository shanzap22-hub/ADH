-- Add group support to conversations
ALTER TABLE chat_conversations
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS group_image_url TEXT;

-- Update RLS for Groups
-- Allow everyone to view GROUP conversations (even if their ID is not in participant_ids explicitly, 
-- or we can just treat 'participant_ids' as empty for public groups and use this flag)

DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
CREATE POLICY "Users can view own or group conversations"
ON chat_conversations FOR SELECT
USING (
    (auth.uid() = ANY(participant_ids)) OR (is_group = true)
);

-- Allow everyone to insert messages into GROUP conversations
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON chat_messages;
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

-- Allow everyone to view messages in GROUP conversations
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
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

-- Create the Default Global Group if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM chat_conversations WHERE is_group = true AND group_name = 'Community Chat') THEN
        INSERT INTO chat_conversations (is_group, group_name, participant_ids)
        VALUES (true, 'Community Chat', '{}');
    END IF;
END $$;
