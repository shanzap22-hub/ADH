import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Streaming response - allow up to 60 seconds
export const maxDuration = 60;

// --- TOKEN BUDGET CONFIG (Gemini Free Tier Friendly) ---
const DAILY_MESSAGE_LIMIT = 50; // ഓരോ user-നും ദിവസം 50 messages
const MAX_HISTORY_MESSAGES = 8; // Context-ന് അവസാന 8 messages മാത്രം (token save)
const MAX_OUTPUT_TOKENS = 2048; // ഡീറ്റെയിൽഡ് answers-ന് enough, free tier-ന് safe

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function fetchImageAsBase64(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);
        return {
            inlineData: {
                data: base64,
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
        // API Key check
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.error('[AI Chat] GEMINI_API_KEY is missing!');
            return new Response(JSON.stringify({ error: 'AI Configuration Missing' }), {
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

        // --- TIER ACCESS CHECK ---
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier, role")
            .eq("id", user.id)
            .single();

        const tier = profile?.membership_tier || "bronze";
        const userRole = profile?.role || "student";

        // Admin/Instructor/Super Admin → always allow
        const isPrivileged = ['super_admin', 'admin', 'instructor'].includes(userRole);

        if (!isPrivileged) {
            const { data: tierSettings } = await supabase
                .from("tier_pricing")
                .select("has_ai_access")
                .eq("tier", tier)
                .single();

            if (!tierSettings?.has_ai_access) {
                return new Response(JSON.stringify({
                    error: `AI access is restricted for ${tier} tier. Please upgrade.`
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // --- DAILY USAGE LIMIT CHECK ---
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { data: usageRecord } = await supabase
            .from('ai_usage_daily')
            .select('id, message_count')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

        const currentCount = usageRecord?.message_count || 0;

        if (currentCount >= DAILY_MESSAGE_LIMIT && !isPrivileged) {
            console.warn(`[AI Chat] Daily limit reached for user ${user.id}: ${currentCount}/${DAILY_MESSAGE_LIMIT}`);
            return new Response(JSON.stringify({
                error: `Daily message limit reached (${DAILY_MESSAGE_LIMIT}/day). Please try again tomorrow.`,
                limitReached: true,
                currentCount,
                limit: DAILY_MESSAGE_LIMIT
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- PROCESS MESSAGE ---
        const lastMessage = messages[messages.length - 1];
        const imageUrl = data?.imageUrl;

        // Save USER message to DB
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

        // --- FETCH WINDOWED HISTORY (Token Optimization) ---
        // അവസാന MAX_HISTORY_MESSAGES messages മാത്രം fetch ചെയ്യുന്നു (full history അല്ല)
        const { data: history } = await supabase
            .from('ai_chat_messages')
            .select('role, content, image_url')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(MAX_HISTORY_MESSAGES);

        // --- RAG: KNOWLEDGE BASE CONTEXT ---
        const genAI = new GoogleGenerativeAI(apiKey);
        let retrievedContext = "";

        try {
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
            }
        } catch (ragError) {
            console.warn('[AI Chat] RAG process failed (ignoring):', ragError);
        }

        // --- SYSTEM PROMPT ---
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

RESPONSE FORMAT:
- Use Markdown formatting for better readability
- Use **bold** for key terms and important points
- Use bullet points and numbered lists for steps
- Use code blocks for any code examples
- Keep responses concise but complete
- Use headings (##) for long responses with multiple sections

${retrievedContext ? `\n[Context from Knowledge Base]:\n${retrievedContext}` : ''}`;

        // --- BUILD CHAT HISTORY (Windowed) ---
        const chatHistory: any[] = [];
        // History: Newest → Oldest. Skip current message (index 0), then reverse.
        const rawHistory = history && history.length > 0 ? history.slice(1).reverse() : [];

        // സിസ്റ്റം എറർ മെസ്സേജുകൾ ഫിൽറ്റർ ചെയ്ത് ഒഴിവാക്കുന്നു (AI കൺഫ്യൂഷൻ ഒഴിവാക്കാൻ)
        const cleanHistory = rawHistory.filter(msg => 
            msg.content && 
            !msg.content.includes("Sorry, I encountered an error") && 
            !msg.content.includes("Something went wrong")
        );

        for (const msg of cleanHistory) {
            const role = msg.role === 'user' ? 'user' : 'model';
            const text = msg.content || '[Image Attachment]';

            // ഒരേ റോൾ തുടർച്ചയായി വന്നാൽ മെസ്സേജുകൾ ഒരുമിപ്പിക്കുന്നു (Merge)
            if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === role) {
                chatHistory[chatHistory.length - 1].parts[0].text += "\n\n" + text;
            } else {
                chatHistory.push({
                    role: role,
                    parts: [{ text: text }]
                });
            }
        }

        // Gemini API നിയമപ്രകാരം ചരിത്രം എപ്പോഴും 'user' മെസ്സേജിൽ മാത്രമേ തുടങ്ങാവൂ
        while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
            chatHistory.shift();
        }

        // --- PREPARE PROMPT ---
        let currentPromptText = lastMessage.content;

        // Handle dangling user messages at end of history
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
            const lastUserMsg = chatHistory.pop();
            currentPromptText = lastUserMsg.parts[0].text + "\n\n" + currentPromptText;
        }

        // Message parts (Text + optional Image)
        const messageParts: any[] = [{ text: currentPromptText }];

        if (imageUrl) {
            const imagePart = await fetchImageAsBase64(imageUrl);
            if (imagePart) {
                messageParts.push(imagePart);
            } else {
                messageParts.push({ text: "\n[System Note: The user attempted to upload an image but it failed to load. Please inform the user.]" });
            }
        }

        // --- GENERATE RESPONSE WITH STREAMING ---
        console.log('[AI Chat] Starting streaming response...');

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                let fullText = "";

                try {
                    const generateStream = async (modelName: string) => {
                        const model = genAI.getGenerativeModel({
                            model: modelName,
                            systemInstruction: systemInstruction
                        });

                        const chat = model.startChat({
                            history: chatHistory,
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: MAX_OUTPUT_TOKENS,
                            }
                        });

                        const result = await chat.sendMessageStream(messageParts);

                        for await (const chunk of result.stream) {
                            const chunkText = chunk.text();
                            if (chunkText) {
                                fullText += chunkText;
                                controller.enqueue(encoder.encode(chunkText));
                            }
                        }
                    };

                    try {
                        // Primary: gemini-2.5-flash
                        await generateStream('gemini-2.5-flash');
                    } catch (flashError: any) {
                        console.warn('[AI Chat] gemini-2.5-flash failed:', flashError.message);
                        // Fallback: gemini-2.0-flash
                        fullText = ""; // Reset
                        await generateStream('gemini-2.0-flash');
                    }

                } catch (genError: any) {
                    console.error('[AI Chat] Gemini Generation Error:', genError);

                    // User-friendly error message (no internal details leaked)
                    if (genError.message?.includes('safety')) {
                        fullText = "I cannot answer this request due to safety guidelines.";
                    } else {
                        fullText = "Sorry, I encountered an error. Please try again.";
                    }
                    controller.enqueue(encoder.encode(fullText));
                }

                // --- SAVE AI RESPONSE TO DB ---
                try {
                    const aiResponseTimestamp = new Date().toISOString();
                    await supabase.from('ai_chat_messages').insert({
                        user_id: user.id,
                        role: 'assistant',
                        content: fullText,
                        created_at: aiResponseTimestamp
                    });

                    // --- UPDATE DAILY USAGE COUNTER ---
                    // Approximate token count: ~4 chars per token
                    const approxInputTokens = Math.ceil(currentPromptText.length / 4);
                    const approxOutputTokens = Math.ceil(fullText.length / 4);

                    if (usageRecord) {
                        // Update existing record
                        await supabase
                            .from('ai_usage_daily')
                            .update({
                                message_count: currentCount + 1,
                                total_input_tokens: (usageRecord as any).total_input_tokens + approxInputTokens || approxInputTokens,
                                total_output_tokens: (usageRecord as any).total_output_tokens + approxOutputTokens || approxOutputTokens,
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', usageRecord.id);
                    } else {
                        // Insert new daily record
                        await supabase
                            .from('ai_usage_daily')
                            .insert({
                                user_id: user.id,
                                date: today,
                                message_count: 1,
                                total_input_tokens: approxInputTokens,
                                total_output_tokens: approxOutputTokens
                            });
                    }
                } catch (saveError) {
                    console.error('[AI Chat] Failed to save AI response or update usage:', saveError);
                }

                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Transfer-Encoding': 'chunked'
            }
        });

    } catch (error: any) {
        console.error('[AI Chat] Error:', error);
        return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
