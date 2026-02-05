"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

import { sendOneSignalNotification } from "@/lib/notifications";

// ... (Keep existing uploadChatMedia) ...
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME;
const BUNNY_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_REGION = process.env.BUNNY_STORAGE_REGION || "sg";

export async function uploadChatMedia(formData: FormData): Promise<{ url?: string; error?: string }> {
    const file = formData.get("file") as File;
    if (!file) return { error: "No file uploaded" };

    // Debugging: Check if keys are loaded
    if (!process.env.BUNNY_STORAGE_API_KEY) {
        return { error: "Bunny Storage API Key is missing in Vercel env." };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        // Check size (e.g., limit to 4.5MB for Vercel Server Actions safety if using formData return, but here we just upload)
        // Note: Vercel Server Actions have a body limit. If file is > 4MB, it might fail before reaching here.
        // We will proceed assuming it fits or user is warned by Client limit.

        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
        const uploadPath = `chat-media/${fileName}`;

        // Sanitize Region
        let region = (process.env.BUNNY_STORAGE_REGION || 'sg').toLowerCase().trim();
        if (region === "singapore" || region === "asia") region = "sg";
        if (region === "stockholm" || region === "europe") region = "se";
        if (region === "germany") region = "de";

        // Sanitize Zone Name
        let zoneName = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME || "";
        zoneName = zoneName.replace(".b-cdn.net", "").trim();

        if (!zoneName) return { error: "Bunny Zone Name is missing." };

        const hostname = region === 'de' ? 'storage.bunnycdn.com' : `${region}.storage.bunnycdn.com`;
        const endpoint = `https://${hostname}/${zoneName}/${uploadPath}`;

        // Detect proper Content-Type based on file extension
        let contentType = "application/octet-stream";
        const ext = file.name.toLowerCase().split('.').pop();
        if (ext === 'png') contentType = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'gif') contentType = 'image/gif';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'webm') contentType = 'audio/webm';
        else if (ext === 'mp3') contentType = 'audio/mpeg';
        else if (ext === 'mp4') contentType = 'video/mp4';

        const response = await fetch(endpoint, {
            method: "PUT",
            headers: {
                AccessKey: process.env.BUNNY_STORAGE_API_KEY,
                "Content-Type": contentType,
            },
            body: arrayBuffer, // Pass ArrayBuffer directly
        });

        if (!response.ok) {
            console.error(`Bunny Upload Error ${response.status}: ${await response.text()}`);
            return { error: `Upload Failed (${response.status})` };
        }

        const pullZoneDomain = process.env.NEXT_PUBLIC_BUNNY_PULL_ZONE_DOMAIN || process.env.BUNNY_PULL_ZONE_DOMAIN || "adh-connect.b-cdn.net";

        if (pullZoneDomain) {
            return { url: `https://${pullZoneDomain}/${uploadPath}` };
        }

        return { url: `https://${hostname}/${zoneName}/${uploadPath}` };

    } catch (error: any) {
        console.error("Upload Action Exception:", error);
        return { error: "Server Error: " + error.message };
    }
}


export async function getGlobalGroupChat() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch the Public Group
    const { data: group, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("is_group", true)
        .eq("group_name", "Community Chat")
        .single();

    if (group) return group;

    // If somehow missing (should be created by SQL), try to create
    // Note: Usually INSERT policies might block users from creating public groups.
    // ... (Existing code)

    throw new Error("Global chat not initialized");
}

export async function deleteChatMessage(messageId: string): Promise<{ success?: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // Check Role from Profile
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const isRoleAdmin = ['admin', 'super_admin', 'instructor'].includes(profile?.role || '');

    // Explicit Super Admin Email
    const isSuperEmail = user.email === 'shanzap22@gmail.com';

    // If Admin/Instructor, use Service Role to Bypass RLS
    if (isRoleAdmin || isSuperEmail) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
            return { error: "Server Configuration Error: Missing Secret Key" };
        }

        const adminClient = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { error } = await adminClient.from('chat_messages').delete().eq('id', messageId);

        if (error) {
            console.error("Admin Delete Failed:", error);
            return { error: "Admin Delete Failed: " + error.message };
        }
        return { success: true };
    }

    // Normal User: Attempt Standard Delete (RLS will enforce 'ownership' check)
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);

    if (error) return { error: error.message };

    return { success: true };
}

export async function toggleChatMute(conversationId: string, isMuted: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized", success: false };

    const { error } = await supabase
        .from('chat_notification_settings')
        .upsert(
            { user_id: user.id, conversation_id: conversationId, is_muted: isMuted },
            { onConflict: 'user_id,conversation_id' }
        );

    if (error) {
        console.error("Mute Toggle Error:", error);
        return { error: error.message, success: false };
    }

    return { success: true };
}

export async function getChatMuteStatus(conversationId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from('chat_notification_settings')
        .select('is_muted')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .single();

    return data?.is_muted || false;
}

export async function sendChatMessage(
    conversationId: string,
    content: string,
    type: string,
    mediaUrl: string | null,
    replyToId: string | null
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Insert Message
    const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        type: type,
        media_url: mediaUrl,
        reply_to_id: replyToId
    });

    if (error) {
        console.error("Send Message Error:", error);
        return { success: false, error: error.message };
    }

    // 2. Trigger Notification (Background)
    // We don't await this to keep UI snappy, or we can await if critical.
    (async () => {
        try {
            // Check if Group
            const { data: conversation } = await supabase
                .from('chat_conversations')
                .select('is_group, group_name')
                .eq('id', conversationId)
                .single();

            if (conversation?.is_group) {
                // Fetch sender name separately
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                const senderName = senderProfile?.full_name || 'Someone';
                const notificationBody = type === 'image' ? 'Sent an image' : type === 'audio' ? 'Sent a voice note' : content;

                // Mute Filter: Exclude users who have tag "muted_chat_CONVID" = "true"
                const filters = [
                    { field: "tag", key: `muted_chat_${conversationId}`, relation: "!=", value: "true" }
                ];

                await sendOneSignalNotification(
                    conversation.group_name || 'New Message',
                    `${senderName}: ${notificationBody}`,
                    ['All'], // Target All Users segment, but filtered by Tag
                    { conversationId: conversationId },
                    undefined, // No specific user IDs
                    filters
                );
            }
        } catch (e) {
            console.error("Notification Trigger Error:", e);
        }
    })();

    return { success: true };
}
