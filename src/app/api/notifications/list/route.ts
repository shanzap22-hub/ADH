
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "8686c7a8-f9ee-4a88-b2ff-93d74d045383";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_q2dmpkhz5zfirmx7splu2bctqmd3m75ear4enf43jityzulrocvt2aleajyfvccqxswkpjl2vsq3kk7p5yx2ohikuizpfwxrn2les4a";

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user profile to get last cleared time
        const { data: profile } = await supabase
            .from('profiles')
            .select('notifications_last_cleared_at')
            .eq('id', user.id)
            .single();

        const lastClearedAt = profile?.notifications_last_cleared_at ? new Date(profile.notifications_last_cleared_at).getTime() : 0;

        // Fetch Notifications from OneSignal API
        const response = await fetch(`https://onesignal.com/api/v1/notifications?app_id=${ONESIGNAL_APP_ID}&limit=20`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`OneSignal API Error: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform the data for the frontend and filter by cleared time
        const notifications = (data.notifications || [])
            .filter((n: any) => {
                const createdAt = new Date(n.send_after * 1000).getTime();
                return createdAt > lastClearedAt;
            })
            .map((n: any) => ({
                id: n.id,
                title: n.headings?.en || "Notification",
                message: n.contents?.en || "No content",
                created_at: new Date(n.send_after * 1000).toISOString(),
                url: n.data?.url || n.url || null
            }));

        return NextResponse.json({ notifications });

    } catch (error: any) {
        console.error("Fetch Notifications Error:", error);
        // Fallback to empty list gracefully instead of crashing UI
        return NextResponse.json({ notifications: [] });
    }
}
