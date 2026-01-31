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

        //Ideally check for admin role here
        // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        // if (profile?.role !== 'admin') { ... }

        const body = await req.json();
        const { title, message } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }

        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                included_segments: ['All'], // Sends to everyone
                headings: { en: title },
                contents: { en: message },
                // Optional: Add data for deeplinking
                // data: { url: '/dashboard' } 
            })
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
