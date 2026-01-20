-- Create the AI Chat Messages table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS dx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own messages
CREATE POLICY "Users can view their own AI chat messages"
    ON public.ai_chat_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own messages
CREATE POLICY "Users can insert their own AI chat messages"
    ON public.ai_chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role (backend) can manage all messages (implicitly enabled by bypassing RLS, but explicit for clarity if needed)
-- Note: Supabase service role bypasses RLS automatically.
