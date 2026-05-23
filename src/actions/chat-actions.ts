"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { after } from "next/server";

import { sendOneSignalNotification } from "@/lib/notifications";
import { uploadToR2 } from "./r2";

// ... (Keep existing uploadChatMedia) ...
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE_NAME || process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE_NAME;
const BUNNY_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_REGION = process.env.BUNNY_STORAGE_REGION || "sg";

export async function uploadChatMedia(formData: FormData): Promise<{ url?: string; error?: string }> {
    return await uploadToR2(formData, "chat-media");
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

    // Check Tier Access for Chat
    const { data: profile } = await supabase.from("profiles").select("membership_tier").eq("id", user.id).single();
    const tier = profile?.membership_tier || "bronze";
    const { data: tierSettings } = await supabase.from("tier_pricing").select("has_community_chat_access").eq("tier", tier).single();

    if (tierSettings && !tierSettings.has_community_chat_access) {
        throw new Error(`Chat access is restricted for ${tier} tier.`);
    }

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
    replyToId: string | null,
    id?: string // Optional ID from client
): Promise<{ success: boolean; error?: string; data?: any }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Insert Message
    const { data, error } = await supabase.from("chat_messages").insert({
        id: id || undefined, // Use client ID if provided
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
        type: type,
        media_url: mediaUrl,
        reply_to_id: replyToId
    }).select().single();

    if (error) {
        console.error("Send Message Error:", error);
        return { success: false, error: error.message };
    }

    // 2. Trigger Notification (Background via Next.js after)
    after(async () => {
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

                // Mute Filter: Exclude users who have explicitly muted the chat.
                // We use an OR condition: (tag doesn't exist) OR (tag is 'false').
                // AND we exclude the sender.
                const filters = [
                    { field: "tag", key: `muted_chat_${conversationId}`, relation: "not_exists" },
                    { field: "tag", key: "user_id", relation: "!=", value: user.id },
                    { operator: "OR" },
                    { field: "tag", key: `muted_chat_${conversationId}`, relation: "=", value: "false" },
                    { field: "tag", key: "user_id", relation: "!=", value: user.id }
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
    });

    return { success: true, data };
}

export async function blockUser(blockedId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    if (user.id === blockedId) return { success: false, error: "You cannot block yourself" };

    const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: user.id, blocked_id: blockedId });

    if (error) {
        console.error("Block User Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function unblockUser(blockedId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId);

    if (error) {
        console.error("Unblock User Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getBlockedUsers(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

    if (error) {
        console.error("Get Blocked Users Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data.map(d => d.blocked_id) };
}

export async function getBlockedUsersWithProfiles(): Promise<{ success: boolean; data?: { id: string; full_name: string | null; avatar_url: string | null }[]; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { data: blocks, error: blockError } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

    if (blockError) {
        console.error("Get Blocked Users error:", blockError);
        return { success: false, error: blockError.message };
    }

    if (!blocks || blocks.length === 0) {
        return { success: true, data: [] };
    }

    const blockedIds = blocks.map(b => b.blocked_id);
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', blockedIds);

    if (profileError) {
        console.error("Get Blocked Profiles error:", profileError);
        return { success: false, error: profileError.message };
    }

    const formattedData = profiles.map(p => ({
        id: p.id,
        full_name: p.full_name || 'User',
        avatar_url: p.avatar_url || null
    }));

    return { success: true, data: formattedData };
}

export async function reportMessage(messageId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
        .from('message_reports')
        .insert({ reporter_id: user.id, message_id: messageId, reason });

    if (error) {
        console.error("Report Message Error:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
