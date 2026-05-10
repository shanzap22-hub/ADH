"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleRitualAction(ritualId: string, isCompleted: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const today = new Date().toISOString().split('T')[0];

    if (isCompleted) {
        // Add log
        const { error } = await supabase
            .from("user_daily_ritual_logs")
            .insert({
                user_id: user.id,
                ritual_id: ritualId,
                completed_date: today
            });
        
        if (error && error.code !== '23505') { // Ignore duplicate key errors
            console.error("Error toggling ritual:", error);
            return { success: false, error: error.message };
        }
    } else {
        // Remove log
        const { error } = await supabase
            .from("user_daily_ritual_logs")
            .delete()
            .eq("user_id", user.id)
            .eq("ritual_id", ritualId)
            .eq("completed_date", today);

        if (error) {
            console.error("Error toggling ritual:", error);
            return { success: false, error: error.message };
        }
    }

    revalidatePath("/profile");
    return { success: true };
}

export async function updateIncomeTargetAction(currentAmount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("user_income_targets")
        .update({ current_amount: currentAmount, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating income:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/profile");
    return { success: true };
}

export async function adminUpdateUserJourneyAction(
    userId: string, 
    milestoneName: string, 
    currentAmount: number, 
    targetAmount: number
) {
    const supabase = await createClient();
    
    // Check if admin
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error("Unauthorized");
    
    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();
        
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
        throw new Error("Insufficient permissions");
    }

    // 1. Update Revenue
    const { error: revError } = await supabase
        .from("user_income_targets")
        .upsert({ 
            user_id: userId, 
            current_amount: currentAmount, 
            target_amount: targetAmount,
            updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });

    if (revError) throw revError;

    // 2. Check if milestone changed
    const { data: existingMilestones } = await supabase
        .from("user_milestones")
        .select("*")
        .eq("user_id", userId)
        .eq("milestone_name", milestoneName)
        .single();

    if (!existingMilestones) {
        // Add new milestone
        await supabase
            .from("user_milestones")
            .insert({
                user_id: userId,
                milestone_name: milestoneName,
                is_completed: true,
                completed_at: new Date().toISOString()
            });
    }

    revalidatePath("/profile");
    revalidatePath("/admin/journey");
    return { success: true };
}

export async function saveAffirmationsAction(affirmations: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("user_rituals_data")
        .upsert({ 
            user_id: user.id, 
            affirmations, 
            updated_at: new Date().toISOString() 
        }, { onConflict: 'user_id' });

    if (error) {
        console.error("Error saving affirmations:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/profile");
    return { success: true };
}

export async function updateRitualAction(
    ritualId: string,
    updates: { ritual_name?: string; audio_url?: string; is_active?: boolean }
) {
    const supabase = await createClient();
    
    // Check if admin
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error("Unauthorized");
    
    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();
        
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
        throw new Error("Insufficient permissions");
    }

    const { error } = await supabase
        .from("daily_rituals")
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq("id", ritualId);

    if (error) {
        console.error("Error updating ritual:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/journey");
    revalidatePath("/profile");
    return { success: true };
}

export async function updateJourneyConfigAction(key: string, value: any) {
    const supabase = await createClient();
    
    // Check if admin
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error("Unauthorized");
    
    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUser.id)
        .single();
        
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'super_admin') {
        throw new Error("Insufficient permissions");
    }

    const { error } = await supabase
        .from("journey_config")
        .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        console.error("Error updating journey config:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/journey");
    revalidatePath("/profile");
    return { success: true };
}
