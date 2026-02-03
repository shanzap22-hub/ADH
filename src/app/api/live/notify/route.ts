import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNotificationSettings, sendOneSignalNotification } from "@/lib/notifications";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Admin/Instructor Check
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();
        if (!['admin', 'super_admin', 'instructor'].includes(profile?.role || '')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { type } = await req.json(); // type: 'start' | 'reminder'

        const settings = await getNotificationSettings();

        // Get Latest Session
        const { data: session } = await (supabase as any)
            .from("weekly_live_sessions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!session) return NextResponse.json({ error: "No active session found" }, { status: 404 });

        let title = "";
        let message = "";

        if (type === 'start') {
            if (!settings.live_start) return NextResponse.json({ skipped: true, reason: 'Setting disabled' });
            title = "🔴 Live Now: Weekly Mastermind";
            message = `The session "${session.title}" has started! Join now.`;
        } else if (type === 'reminder') {
            if (!settings.live_reminders) return NextResponse.json({ skipped: true, reason: 'Setting disabled' });
            title = "⏰ Starting Soon: Weekly Mastermind";
            message = `The session "${session.title}" starts in 1 hour. Get ready!`;
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const result = await sendOneSignalNotification(title, message, ['All'], { url: session.join_url });

        return NextResponse.json(result);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
