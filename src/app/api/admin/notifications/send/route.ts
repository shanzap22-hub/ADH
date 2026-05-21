import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "8686c7a8-f9ee-4a88-b2ff-93d74d045383";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_q2dmpkhz5zfirmx7splu2bctqmd3m75ear4enf43jityzulrocvt2aleajyfvccqxswkpjl2vsq3kk7p5yx2ohikuizpfwxrn2les4a";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check for Admin Role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

        if (!['admin', 'super_admin'].includes(profile?.role || '') && user.email !== 'shanzap22@gmail.com') {
            return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }

        const body = await req.json();
        const { title, message, url, targetWeb = true, targetApp = true } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }

        if (!targetWeb && !targetApp) {
            return NextResponse.json({ error: "At least one target platform is required" }, { status: 400 });
        }

        // Configure OneSignal Body
        const oneSignalBody: any = {
            app_id: ONESIGNAL_APP_ID,
            included_segments: ['All'],
            headings: { en: title },
            contents: { en: message },
        };

        if (url && url.trim()) {
            oneSignalBody.url = url.trim();
            oneSignalBody.data = { url: url.trim() };
        }

        // If both are true, it sends to everyone in the segment (Web + Android + iOS)
        // If not both, we can specify explicitly using isAndroid, isAnyWeb
        if (!targetWeb) {
            oneSignalBody.isAnyWeb = false;
        }
        if (!targetApp) {
            oneSignalBody.isAndroid = false;
            oneSignalBody.isIos = false;
        }

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: ONESIGNAL_REST_API_KEY.startsWith("os_v2_")
                    ? `Key ${ONESIGNAL_REST_API_KEY}`
                    : `Basic ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(oneSignalBody)
        };

        const response = await fetch('https://onesignal.com/api/v1/notifications', options);
        const data = await response.json();

        if (!response.ok) {
            console.error("OneSignal Error:", data);
            return NextResponse.json({ error: data.errors?.[0] || "Failed to send notification" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error("Notification API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
