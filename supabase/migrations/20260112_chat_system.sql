-- Add chat_enabled column to tier_pricing
ALTER TABLE tier_pricing 
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT false;

-- Update default values (Admin can change later)
UPDATE tier_pricing SET chat_enabled = true WHERE tier IN ('gold', 'diamond');
UPDATE tier_pricing SET chat_enabled = true WHERE tier IN ('bronze', 'silver'); 

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    participant_ids UUID[] NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_preview TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_participants ON chat_conversations USING GIN(participant_ids);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    type TEXT CHECK (type IN ('text', 'image', 'audio', 'file')),
    media_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS Policies
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations Policies
CREATE POLICY "Users can view their own conversations"
ON chat_conversations FOR SELECT
USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Admins can view all conversations"
ON chat_conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'instructor')
    )
);

CREATE POLICY "Users can create conversations"
ON chat_conversations FOR INSERT
WITH CHECK (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update their own conversations"
ON chat_conversations FOR UPDATE
USING (auth.uid() = ANY(participant_ids));

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND auth.uid() = ANY(chat_conversations.participant_ids)
    )
);

CREATE POLICY "Admins can view all messages"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'instructor')
    )
);

CREATE POLICY "Users can insert messages in their conversations"
ON chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_conversations
        WHERE chat_conversations.id = chat_messages.conversation_id
        AND auth.uid() = ANY(chat_conversations.participant_ids)
    )
    AND auth.uid() = sender_id
);

-- Trigger for Timestamp
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET 
        updated_at = NOW(),
        last_message_at = NOW(),
        last_message_preview = 
            CASE 
                WHEN NEW.type = 'text' THEN NEW.content 
                WHEN NEW.type = 'image' THEN '📷 Image'
                WHEN NEW.type = 'audio' THEN '🎤 Voice Note'
                ELSE 'Attachment'
            END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chat_timestamp_trigger ON chat_messages;
CREATE TRIGGER update_chat_timestamp_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_timestamp();
