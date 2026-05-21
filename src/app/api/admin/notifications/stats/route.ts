import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "8686c7a8-f9ee-4a88-b2ff-93d74d045383";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_q2dmpkhz5zfirmx7splu2bctqmd3m75ear4enf43jityzulrocvt2aleajyfvccqxswkpjl2vsq3kk7p5yx2ohikuizpfwxrn2les4a";

export const runtime = 'edge';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify Admin Role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!['admin', 'super_admin'].includes(profile?.role || '')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let totalSubscribers = 0;

        // Fetch App Details for Subscriber Count
        try {
            const appResponse = await fetch(`https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}`, {
                method: 'GET',
                headers: {
                    Authorization: ONESIGNAL_REST_API_KEY.startsWith("os_v2_")
                        ? `Key ${ONESIGNAL_REST_API_KEY}`
                        : `Basic ${ONESIGNAL_REST_API_KEY}`,
                    "Content-Type": "application/json",
                },
                cache: 'no-store'
            });

            if (appResponse.ok) {
                const appData = await appResponse.json();
                totalSubscribers = appData.messageable_players || 0;
            }
        } catch (e) {
            console.error("Failed to fetch app details", e);
        }

        // Fetch Notifications from OneSignal API
        const response = await fetch(`https://onesignal.com/api/v1/notifications?app_id=${ONESIGNAL_APP_ID}&limit=10`, {
            method: 'GET',
            headers: {
                Authorization: ONESIGNAL_REST_API_KEY.startsWith("os_v2_")
                    ? `Key ${ONESIGNAL_REST_API_KEY}`
                    : `Basic ${ONESIGNAL_REST_API_KEY}`,
                "Content-Type": "application/json",
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`OneSignal API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform the data for the frontend stats
        const notificationStats = (data.notifications || []).map((n: any) => ({
            id: n.id,
            title: n.headings?.en || "Notification",
            message: n.contents?.en || "No content",
            created_at: new Date((n.queued_at || n.send_after) * 1000).toISOString(),
            successful: n.successful || 0,
            failed: n.failed || 0,
            converted: n.converted || 0,
            remaining: n.remaining || 0
        }));

        return NextResponse.json({ 
            stats: notificationStats,
            totalSubscribers 
        });

    } catch (error: any) {
        console.error("Fetch Notification Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
