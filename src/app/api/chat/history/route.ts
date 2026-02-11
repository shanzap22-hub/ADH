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

        // 2. Fetch chat history (latest 50 messages, newest first)
        const { data: history, error } = await supabase
            .from('ai_chat_messages') // Updated table name
            .select('id, role, content, image_url, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }) // Fetch LATEST messages first
            .limit(50);

        if (error) {
            console.error('[Chat History] Database error:', error);
            return Response.json({ error: 'Failed to load history' }, { status: 500 });
        }

        // 3. Reverse for chronological order (oldest → newest) for UI display
        const chronologicalHistory = history ? [...history].reverse() : [];

        // 4. Return messages with explicit no-cache headers
        return Response.json({
            success: true,
            messages: chronologicalHistory,
            count: chronologicalHistory.length
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });

    } catch (error: any) {
        console.error('[Chat History] Error:', error);
        return Response.json({
            error: error.message || 'Failed to load chat history'
        }, { status: 500 });
    }
}
