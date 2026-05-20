"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function awardPointsAction(
    points: number,
    reason: string,
    metadata: any = {},
    oncePerDay: boolean = false
) {
    // SECURITY: Always get user from the session, DO NOT trust client input for userId
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = user.id;
    const supabaseAdmin = createAdminClient();

    try {
        if (oncePerDay) {
            // Check if already awarded today for this reason
            const startOfDay = new Date();
            startOfDay.setUTCHours(0, 0, 0, 0);

            const { data: existing } = await supabaseAdmin
                .from("gamification_ledger")
                .select("id")
                .eq("user_id", userId)
                .eq("reason", reason)
                .gte("created_at", startOfDay.toISOString())
                .limit(1);

            if (existing && existing.length > 0) {
                return { success: false, message: "Points already awarded today for this action." };
            }
        } else if (metadata?.chapter_id) {
            // For chapters, only award once EVER
            const { data: existing } = await supabaseAdmin
                .from("gamification_ledger")
                .select("id")
                .eq("user_id", userId)
                .eq("reason", reason)
                .contains("metadata", { chapter_id: metadata.chapter_id })
                .limit(1);
            
            if (existing && existing.length > 0) {
                 return { success: false, message: "Points already awarded for this chapter." };
            }
        } else if (metadata?.meeting_id) {
            // For meetings, only award once EVER per meeting
            const { data: existing } = await supabaseAdmin
                .from("gamification_ledger")
                .select("id")
                .eq("user_id", userId)
                .eq("reason", reason)
                .contains("metadata", { meeting_id: metadata.meeting_id })
                .limit(1);
            
            if (existing && existing.length > 0) {
                 return { success: false, message: "Points already awarded for this meeting." };
            }
        }

        // 1. Insert into ledger
        const { error: insertError } = await supabaseAdmin
            .from("gamification_ledger")
            .insert({
                user_id: userId,
                points: points,
                reason: reason,
                metadata: metadata
            });

        if (insertError) throw insertError;

        // 2. Fetch current score
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("gamification_score")
            .eq("id", userId)
            .single();

        const newScore = (profile?.gamification_score || 0) + points;

        // 3. Update profile
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ gamification_score: newScore })
            .eq("id", userId);

        if (updateError) throw updateError;

        revalidatePath("/dashboard");
        revalidatePath("/profile");
        return { success: true, newScore };
    } catch (error) {
        console.error("Error awarding points:", error);
        return { success: false, error: "Failed to award points" };
    }
}

export async function deductPointsAction(
    points: number,
    reason: string,
    metadata: any = {}
) {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const userId = user.id;
    const supabaseAdmin = createAdminClient();

    try {
        // 1. Remove from ledger (we find the specific entry to delete based on reason and metadata)
        let query = supabaseAdmin
            .from("gamification_ledger")
            .delete()
            .eq("user_id", userId)
            .eq("reason", reason);

        // If metadata has ritualId, ensure we delete the specific one
        if (metadata?.ritualId) {
            query = query.contains("metadata", { ritualId: metadata.ritualId });
        }

        const { error: deleteError } = await query;
        if (deleteError) throw deleteError;

        // 2. Fetch current score
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("gamification_score")
            .eq("id", userId)
            .single();

        let currentScore = profile?.gamification_score || 0;
        let newScore = Math.max(0, currentScore - points); // Don't go below 0

        // 3. Update profile
        const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({ gamification_score: newScore })
            .eq("id", userId);

        if (updateError) throw updateError;

        revalidatePath("/dashboard");
        revalidatePath("/profile");
        return { success: true, newScore };
    } catch (error) {
        console.error("Error deducting points:", error);
        return { success: false, error: "Failed to deduct points" };
    }
}
