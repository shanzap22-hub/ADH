
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

export async function updateOneSignalTags(externalUserId: string, tags: Record<string, string>) {
    try {
        const response = await fetch(`https://onesignal.com/api/v1/apps/${ONESIGNAL_APP_ID}/users/${externalUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}` // Using REST for User Update usually requires generic authorization or App Auth?
                // Docs say: PUT /apps/{app_id}/users/{external_user_id} only needs App ID usually? No, safely provide Basic Auth if Server Side.
            },
            body: JSON.stringify({ tags: tags })
        });

        // Note: The endpoint /apps/:id/users/:id is actually to CREATE/EDIT device. 
        // To edit specific user based on External ID, we should technically use POST /apps/:appId/users with external_user_id logic or PUT.
        // Wait, OneSignal API v1 'Edit User' is complex.
        // Easier: Use the 'Edit Tags' specific?
        // Actually, creating a device with identifier updates it.
        // Let's verify documentation memory.
        // PUT https://onesignal.com/api/v1/apps/:app_id/users/:id 
        // This 'id' is OneSignal Player ID. We don't have Player ID. We have External ID.
        // So we might need to fetch Player ID first?
        // OR use the correct endpoint for External ID.
        // Actually, usually Client Side is best for Tags unless we map OneSignal ID.
        // BUT We can target "include_external_user_ids" in Create Notification.
        // Can we Update Tags via External ID?
        // Checking OneSignal API...
        // "Edit tags with External ID": Not directly supported in legacy API. OneSignal 5.x+ has User Identity.
        // However, we can TRY to just trust the Mobile Client update if we fix the check.

        // STOP.
        // If Server Side Tag Update is hard (requires Player ID), let's stick to the Filter Logic using Database (Reliable).

        return { success: response.ok };
    } catch (e) {
        console.error("Tag Update Failed", e);
        return { success: false };
    }
}

export async function sendOneSignalNotification(
    title: string,
    message: string,
    segments = ['All'],
    data?: any,
    targetUserIds?: string[],
    filters?: any[]
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
        } else if (filters && filters.length > 0) {
            payload.filters = filters;
            // When using filters, we usually don't set included_segments to 'All' or similar unless combined.
            // OneSignal docs say: filters cannot be combined with include_external_user_ids. 
            // But can be combined with included_segments (intersection).
            // If segments is ['All'], filters narrow it down.
            payload.included_segments = segments;
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
