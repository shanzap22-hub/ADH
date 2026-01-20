import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, data } = await req.json();
        // 'data' can carry extra info like image URLs if not embedded in content

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // 1. Identify the new user message (last one)
        const lastMessage = messages[messages.length - 1];

        // Check for image URL in the 'data' payload or message content
        const imageUrl = data?.imageUrl;

        // 2. Save USER message to Supabase
        // We treat the incoming message as the one to save.
        // If it has an image, we save the URL.
        await supabase.from('ai_chat_history').insert({
            user_id: user.id,
            role: 'user',
            content: lastMessage.content, // Assuming text content
            media_url: imageUrl || null
        });

        // 3. Fetch History from Supabase (Context Management)
        // Fetch last 10 messages for context
        const { data: history } = await supabase
            .from('ai_chat_history')
            .select('role, content, media_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // Format for AI SDK
        // History needs to be reversed (oldest first)
        const previousMessages = history ? history.reverse().map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.media_url ? [
                { type: 'text', text: msg.content || "" },
                { type: 'image', image: new URL(msg.media_url) }
            ] : msg.content
        })) : [];

        // 4. Construct System Prompt
        const SYSTEM_PROMPT = `
    You are a helpful, encouraging AI course coach for the 'ADH Learning Management System'.
    Your goal is to help students understand the curriculum, answer doubts, and provide motivation.
    
    Guidelines:
    - Answer based on the provided course context (if specific context is injected) or general knowledge about the subject.
    - Be concise but friendly.
    - Do not hallucinate facts. If you don't know, say "I recommend checking the course materials for that specific detail."
    - React positively to images if provided (e.g. "That code screenshot looks close, but check line 5...").
    `;

        // 5. Call AI Model
        // Merge history + new message (which is already in history if we just fetched it? 
        // Wait, we just inserted it. So 'history' request includes it? 
        // Yes, if we didn't use transaction isolation issues. 
        // Safe bet: Fetch history excluding the one we just inserted, or just use 'history' which now contains it.
        // Let's assume 'history' contains it.

        const result = await streamText({
            model: google('models/gemini-1.5-flash'), // or gemini-pro
            system: SYSTEM_PROMPT,
            messages: previousMessages as any,

            async onFinish({ text }) {
                // 6. Save AI Response to Supabase
                await supabase.from('ai_chat_history').insert({
                    user_id: user.id,
                    role: 'assistant', // mapped from 'ai'
                    content: text,
                });
            },
        });

        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
