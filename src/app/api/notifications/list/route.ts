
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

        // Fetch Notifications from OneSignal API
        // Endpoint: View Notifications
        // Query: ?limit=20&kind=1 (1 = Dashboard only? No, default is 0 or 1).
        // Note: OneSignal API returns ALL notifications sent by the App.
        // We need to filter only those that are relevant (e.g. sent to 'All' or via Segments).

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

        // Transform the data for the frontend
        const notifications = (data.notifications || []).map((n: any) => ({
            id: n.id,
            title: n.headings?.en || "Notification",
            message: n.contents?.en || "No content",
            created_at: new Date(n.send_after * 1000).toISOString(), // send_after is unix timestamp
            url: n.data?.url || n.url || null
        }));

        return NextResponse.json({ notifications });

    } catch (error: any) {
        console.error("Fetch Notifications Error:", error);
        // Fallback to empty list gracefully instead of crashing UI
        return NextResponse.json({ notifications: [] });
    }
}
