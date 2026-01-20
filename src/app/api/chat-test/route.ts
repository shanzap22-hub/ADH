import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * MINIMAL TEST ENDPOINT
 * Purpose: Isolate Google Gemini API issue without Supabase/database complexity
 * Tests: API key, model initialization, basic response generation
 */
export async function POST(req: Request) {
    try {
        console.log('[CHAT-TEST] Starting minimal test...');

        // 1. Check API key
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        console.log('[CHAT-TEST] API Key exists:', !!apiKey);
        console.log('[CHAT-TEST] API Key prefix:', apiKey?.substring(0, 10) + '...');

        if (!apiKey) {
            return Response.json({
                error: 'API key missing',
                envVars: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE'))
            }, { status: 500 });
        }

        // 2. Initialize Google AI
        console.log('[CHAT-TEST] Initializing GoogleGenerativeAI...');
        const genAI = new GoogleGenerativeAI(apiKey);

        // 3. Test with gemini-1.5-flash first
        console.log('[CHAT-TEST] Getting gemini-1.5-flash model...');
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        console.log('[CHAT-TEST] Model initialized successfully');

        // 4. Generate simple content (NO STREAMING)
        console.log('[CHAT-TEST] Generating content...');
        const result = await model.generateContent('Say "Hello from Gemini!" and nothing else.');

        console.log('[CHAT-TEST] Content generated successfully');
        const response = await result.response;
        const text = response.text();

        console.log('[CHAT-TEST] Response text:', text);

        // 5. Return success
        return Response.json({
            success: true,
            model: 'gemini-1.5-flash',
            response: text,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        // Comprehensive error logging
        console.error('[CHAT-TEST] ERROR CAUGHT:', error);
        console.error('[CHAT-TEST] Error name:', error.name);
        console.error('[CHAT-TEST] Error message:', error.message);
        console.error('[CHAT-TEST] Error stack:', error.stack);

        // Check if it's a Google API error
        if (error.message?.includes('GoogleGenerativeAI')) {
            console.error('[CHAT-TEST] This is a Google API error');
        }

        return Response.json({
            error: error.message,
            errorName: error.name,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
