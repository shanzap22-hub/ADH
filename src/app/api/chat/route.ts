import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        // Check if API key exists
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!apiKey) {
            console.error('[AI Chat] GEMINI_API_KEY is missing!');
            return new Response(JSON.stringify({ error: 'AI service not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { messages, data } = await req.json();
        console.log('[AI Chat] Received messages:', messages?.length);

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // 1. Get the new user message
        const lastMessage = messages[messages.length - 1];
        const imageUrl = data?.imageUrl;

        // 2. Save USER message to Supabase
        await supabase.from('ai_chat_history').insert({
            user_id: user.id,
            role: 'user',
            content: lastMessage.content,
            media_url: imageUrl || null
        });

        // 3. Fetch chat history for context
        const { data: history } = await supabase
            .from('ai_chat_history')
            .select('role, content, media_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // 4. System instruction
        const systemInstruction = `You are a helpful, encouraging AI course coach for the 'ADH Learning Management System'.
Your goal is to help students understand the curriculum, answer doubts, and provide motivation.

Guidelines:
- Answer based on the provided course context or general knowledge about the subject.
- Be concise but friendly.
- Do not hallucinate facts. If you don't know, say "I recommend checking the course materials for that specific detail."
- React positively to images if provided.`;

        // 5. Initialize Google Generative AI with system instruction
        // NOTE: Using gemini-2.5-flash (current stable model for v1beta API)
        // Old models like gemini-1.5-flash, gemini-pro are deprecated
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemInstruction
        });

        // 6. Build conversation history in Gemini format
        const chatHistory = history ? history.reverse().slice(0, -1).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        })) : [];

        console.log('[AI Chat] Chat history length:', chatHistory.length);
        console.log('[AI Chat] User prompt:', lastMessage.content);

        // 7. Start chat with history
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        // 8. Send message WITHOUT STREAMING (fixes Vercel serverless SSE issue)
        console.log('[AI Chat] Sending message (non-stream mode)...');
        const result = await chat.sendMessage(lastMessage.content);

        // 9. Get complete response
        const response = await result.response;
        const fullText = response.text();

        console.log('[AI Chat] Response received, length:', fullText.length);

        // 10. Save AI response to database
        await supabase.from('ai_chat_history').insert({
            user_id: user.id,
            role: 'assistant',
            content: fullText,
        });

        console.log('[AI Chat] Response saved to database');

        // 11. Return complete response (no streaming)
        return Response.json({
            success: true,
            message: fullText,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[AI Chat] Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
