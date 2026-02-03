
import { createClient } from "@supabase/supabase-js";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "8686c7a8-f9ee-4a88-b2ff-93d74d045383";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_q2dmpkhz5zfirmx7splu2bctqmd3m75ear4enf43jityzulrocvt2aleajyfvccqxswkpjl2vsq3kk7p5yx2ohikuizpfwxrn2les4a";

export type NotificationType = 'community_post' | 'live_session' | 'one_on_one' | 'custom';

export async function getNotificationSettings() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fallback defaults
    const defaults = {
        community_posts: true,
        live_reminders: true,
        live_start: true,
        one_on_one: true
    };

    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'notification_config')
            .single();

        if (error || !data) return defaults;
        return { ...defaults, ...data.value };
    } catch (e) {
        return defaults;
    }
}

export async function sendOneSignalNotification(
    title: string,
    message: string,
    segments = ['All'],
    data?: any,
    targetUserIds?: string[]
) {
    if (!title || !message) return { error: "Missing title or message" };

    try {
        const payload: any = {
            app_id: ONESIGNAL_APP_ID,
            headings: { en: title },
            contents: { en: message },
            data: data || {},
        };

        if (targetUserIds && targetUserIds.length > 0) {
            payload.include_external_user_ids = targetUserIds;
        } else {
            payload.included_segments = segments;
        }

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.errors?.[0] || 'OneSignal Error');

        return { success: true, id: result.id };
    } catch (error: any) {
        console.error("OneSignal Send Failed:", error);
        return { error: error.message };
    }
}
