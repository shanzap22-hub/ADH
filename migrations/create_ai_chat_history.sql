-- Ensure pgcrypto is available for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the table for AI Chat History
CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT,
    media_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own chats
DROP POLICY IF EXISTS "Users can view own chat history" ON public.ai_chat_history;
CREATE POLICY "Users can view own chat history" ON public.ai_chat_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages
DROP POLICY IF EXISTS "Users can insert own messages" ON public.ai_chat_history;
CREATE POLICY "Users can insert own messages" ON public.ai_chat_history
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_created_at ON public.ai_chat_history(created_at);
