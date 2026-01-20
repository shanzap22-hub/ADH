import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

async function fetchImageAsBase64(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: response.headers.get('content-type') || 'image/jpeg'
            }
        };
    } catch (error) {
        console.error('Error fetching image for AI:', error);
        return null;
    }
}

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
        // 1. Get the new user message
        const lastMessage = messages[messages.length - 1];
        const imageUrl = data?.imageUrl;

        // 2. Save USER message to Supabase
        await supabase.from('ai_chat_messages').insert({
            user_id: user.id,
            role: 'user',
            content: lastMessage.content,
            image_url: imageUrl || null
        });

        // 3. Fetch chat history for context
        const { data: history } = await supabase
            .from('ai_chat_messages')
            .select('role, content, image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // 4. System instruction
        const systemInstruction = `System Prompt for ADH CONNECT AI Coach
You are ADH CONNECT, an intelligent AI facilitator for the ADH Learning Management System (LMS). Your role is to help students with their courses, answer questions, provide motivation, and support their learning journey.

CORE CAPABILITIES:
1. Multimodal Understanding: You can process text, images, and transcribed voice inputs
2. Context Awareness: Remember user identity and course progress
3. Language Support: Primarily Malayalam and English
4. Educational Support: Answer questions about course content, provide explanations, and motivate learners

BEHAVIORAL GUIDELINES:
- Always greet users warmly and acknowledge their identity when known
- Provide concise, helpful responses focused on learning
- Use emojis sparingly and appropriately (👋 😊)
- When receiving images, analyze them carefully - they may contain:
  * Screenshots of course material
  * Handwritten notes or problems
  * Diagrams or charts
  * Code snippets
  * Database schemas or technical documentation

IMAGE PROCESSING INSTRUCTIONS:
When an image is uploaded:
1. First acknowledge: "I can see your image. Let me analyze it..."
2. Describe what you see briefly
3. If it's educational content (code, diagram, text), provide relevant help
4. If it's unclear, ask clarifying questions
5. Never say "I cannot process images" - always attempt analysis

VOICE INPUT HANDLING:
- Transcribed text may contain errors, especially for Malayalam
- If transcription seems phonetic/incorrect, acknowledge: "I noticed the transcription might have some errors. Could you rephrase or type your question?"
- Support code-switching (മലയാളം-English mixing)

RESPONSE FORMAT:
- Keep responses focused and educational
- Break complex explanations into digestible parts
- Provide examples when helpful
- End with a follow-up question or offer for further help`;

        // 5. Initialize Google Generative AI with system instruction
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp', // Using latest flash model
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

        // 8. Prepare message parts (Text + optional Image)
        const messageParts: any[] = [{ text: lastMessage.content }];

        if (imageUrl) {
            console.log('[AI Chat] Fetching image content for Gemini...');
            const imagePart = await fetchImageAsBase64(imageUrl);
            if (imagePart) {
                messageParts.push(imagePart);
                console.log('[AI Chat] Image attached to prompt');
            } else {
                console.warn('[AI Chat] Failed to attach image');
                // Inform the model that the image failed to load, so it can apologize
                messageParts.push({ text: "\n[System Note: The user attempted to upload an image but it failed to load. Please inform the user.]" });
            }
        }

        // 9. Send message WITHOUT STREAMING (fixes Vercel serverless SSE issue)
        console.log('[AI Chat] Sending message (non-stream mode)...');
        const result = await chat.sendMessage(messageParts);

        // 10. Get complete response
        const response = await result.response;
        const fullText = response.text();

        console.log('[AI Chat] Response received, length:', fullText.length);

        // 11. Save AI response to database
        await supabase.from('ai_chat_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: fullText,
        });

        console.log('[AI Chat] Response saved to database');

        // 12. Return complete response (no streaming)
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
