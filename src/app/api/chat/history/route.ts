import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';


/**
 * GET /api/chat/history
 * Fetches the user's chat history from the database
 */
export async function GET() {
    try {
        // 1. Authenticate user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch chat history (last 50 messages)
        const { data: history, error } = await supabase
            .from('ai_chat_history') // Updated table name
            .select('id, role, content, image_url, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }) // Load newest first from DB
            .limit(50);

        if (error) {
            console.error('[Chat History] Database error:', error);
            return Response.json({ error: 'Failed to load history' }, { status: 500 });
        }

        // 3. Return messages
        return Response.json({
            success: true,
            messages: history || [],
            count: history?.length || 0
        });

    } catch (error: any) {
        console.error('[Chat History] Error:', error);
        return Response.json({
            error: error.message || 'Failed to load chat history'
        }, { status: 500 });
    }
}
