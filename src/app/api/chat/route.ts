import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

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
            return new Response(JSON.stringify({ error: 'AI Configuration Missing (GEMINI_API_KEY)' }), {
                status: 503,
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

        // 1.5. CHECK TIER PERMISSION for AI
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier")
            .eq("id", user.id)
            .single();

        const tier = profile?.membership_tier || "bronze";

        const { data: tierSettings } = await supabase
            .from("tier_pricing")
            .select("has_ai_access")
            .eq("tier", tier)
            .single();

        if (!tierSettings?.has_ai_access) {
            console.warn(`[AI Chat] Access Denied for Tier: ${tier}`);
            return new Response(JSON.stringify({
                error: `AI access is restricted for ${tier} tier. Please upgrade.`
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Get the new user message
        const lastMessage = messages[messages.length - 1];
        const imageUrl = data?.imageUrl;

        // 2. Save USER message to Supabase with explicit timestamp
        const userMessageTimestamp = new Date().toISOString();
        const { error: userInsertError } = await supabase.from('ai_chat_messages').insert({
            user_id: user.id,
            role: 'user',
            content: lastMessage.content,
            image_url: imageUrl || null,
            created_at: userMessageTimestamp
        });

        if (userInsertError) {
            console.error('[AI Chat] Failed to save user message:', userInsertError);
            throw new Error('Failed to save message to database');
        }
        console.log('[AI Chat] User message saved successfully');


        // 3. Fetch chat history for context
        const { data: history } = await supabase
            .from('ai_chat_messages')
            .select('role, content, image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        // 4. System instruction (Moved below for RAG context injection)

        // 5. Initialize Google Generative AI with system instruction
        const genAI = new GoogleGenerativeAI(apiKey);

        // RAG: Retrieve Context 
        let retrievedContext = "";
        try {
            console.log('[AI Chat] Retrieving relevant context...');
            const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
            const embeddingResult = await embeddingModel.embedContent(lastMessage.content);
            const embedding = embeddingResult.embedding.values;

            const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 5
            });

            if (!matchError && documents && documents.length > 0) {
                retrievedContext = documents.map((doc: any) => doc.content).join("\n\n");
                console.log(`[AI Chat] Found ${documents.length} relevant context chunks.`);
            } else {
                console.log('[AI Chat] No relevant context found or RAG not set up.');
            }
        } catch (ragError) {
            console.warn('[AI Chat] RAG process failed (ignoring):', ragError);
        }

        const systemInstruction = `System Prompt for ADH CONNECT AI Coach
You are ADH CONNECT, an intelligent AI facilitator for the ADH Learning Management System (LMS). Your role is to help students with their courses, answer questions, provide motivation, and support their learning journey.

CORE CAPABILITIES:
1. Multimodal Understanding: You can process text, images, and transcribed voice inputs
2. Context Awareness: Remember user identity and course progress
3. Knowledge Base Access: You have access to a specific library of uploaded course materials (Context).
4. Language Support: Primarily Malayalam and English

BEHAVIORAL GUIDELINES:
- Always greet users warmly and acknowledge their identity when known
- Provide concise, helpful responses focused on learning
- Use emojis sparingly and appropriately (👋 😊)
- **HYBRID ANSWERING STRATEGY:**
  - If "Context from Knowledge Base" is provided below, USE IT as your primary source of truth.
  - Combine this specific context with your general knowledge to explain concepts clearly.
  - If the context answers the user's question, cite it indirectly (e.g., "According to the course notes...").
  - If the context is empty or irrelevant, fall back completely to your general knowledge.

IMAGE PROCESSING INSTRUCTIONS:
... (same as before) ...

VOICE INPUT HANDLING:
... (same as before) ...

RESPONSE FORMAT:
... (same as before) ...`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemInstruction
        });

        // 6. Build conversation history in Gemini format
        const chatHistory: any[] = [];
        // History is now fetched Newest -> Oldest. 
        // We need to reverse it to be Oldest -> Newest for the AI context window.
        const rawHistory = history ? history.reverse() : [];

        for (const msg of rawHistory) {
            const role = msg.role === 'user' ? 'user' : 'model';
            const text = msg.content || '[Image Attachment]';

            if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === role) {
                chatHistory[chatHistory.length - 1].parts[0].text += "\n\n" + text;
            } else {
                chatHistory.push({
                    role: role,
                    parts: [{ text: text }]
                });
            }
        }

        // 7. Ensure history ends with Model and prepare Prompt
        let currentPromptText = lastMessage.content;

        // INJECT CONTEXT
        if (retrievedContext) {
            currentPromptText = `[Context from Knowledge Base]:\n${retrievedContext}\n\n[User Question]:\n${currentPromptText}`;
        }

        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
            const lastUserMsg = chatHistory.pop();
            currentPromptText = lastUserMsg.parts[0].text + "\n\n" + currentPromptText;
            console.log('[AI Chat] Merged dangling user history into current prompt');
        }

        console.log('[AI Chat] Final Chat history length:', chatHistory.length);
        console.log('[AI Chat] User prompt (with context):', currentPromptText.substring(0, 100) + "...");

        // 8. Start chat with sanitized history (Note: This object is created here but we use create new one in helper below)
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            }
        });

        // 9. Prepare message parts (Text + optional Image)
        const messageParts: any[] = [{ text: currentPromptText }];

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

        let fullText = "";

        try {
            // Helper to try generation
            const generateResponse = async (modelName: string, parts: any[]) => {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction
                });

                const chat = model.startChat({
                    history: chatHistory,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    }
                });

                const result = await chat.sendMessage(parts);
                const response = await result.response;
                return response.text();
            };

            try {
                // Attempt 1: Gemini 2.5 Flash (Stable 2026 Model)
                console.log('[AI Chat] Attempting with gemini-2.5-flash...');
                fullText = await generateResponse('gemini-2.5-flash', messageParts);

            } catch (flashError: any) {
                console.warn('[AI Chat] gemini-2.5-flash failed:', flashError.message);

                // Attempt 2: gemini-3-flash-preview (Latest Frontier)
                console.log('[AI Chat] Falling back to gemini-3-flash-preview...');
                fullText = await generateResponse('gemini-3-flash-preview', messageParts);
            }

        } catch (genError: any) {
            console.error('[AI Chat] Gemini Generation Error:', genError);

            // TEMPORARY DEBUGGING: Expose error to user
            fullText = `Technical Error: ${genError.message || JSON.stringify(genError)}`;

            if (genError.message?.includes('safety')) {
                fullText = "I cannot answer this request due to safety guidelines (**Safety Block**).";
            }
        }

        console.log('[AI Chat] Response received, length:', fullText.length);

        // 11. Save AI response to database with explicit timestamp
        const aiResponseTimestamp = new Date().toISOString();
        const { error: aiInsertError } = await supabase.from('ai_chat_messages').insert({
            user_id: user.id,
            role: 'assistant',
            content: fullText,
            created_at: aiResponseTimestamp
        });

        if (aiInsertError) {
            console.error('[AI Chat] Failed to save AI response:', aiInsertError);
            throw new Error('Failed to save AI response to database');
        }
        console.log('[AI Chat] AI response saved successfully at', aiResponseTimestamp);

        // CRITICAL: Force cache invalidation for chat history
        revalidatePath('/api/chat/history');
        console.log('[AI Chat] Cache invalidated for history endpoint');

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
