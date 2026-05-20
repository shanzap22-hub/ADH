"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function toggleRitualAction(ritualId: string, isCompleted: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    const today = formatter.format(new Date());

    if (isCompleted) {
        // Ritual log add ചെയ്യുന്നു
        const { error } = await supabase
            .from("user_daily_ritual_logs")
            .insert({
                user_id: user.id,
                ritual_id: ritualId,
                completed_date: today
            });
        
        if (error && error.code !== '23505') {
            console.error("Error toggling ritual:", error);
            return { success: false, error: error.message };
        }
    } else {
        // Ritual log remove ചെയ്യുന്നു
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

    // --- Threshold-Based Gamification ---
    // ഇന്ന് എത്ര rituals complete ചെയ്തു എന്ന് count ചെയ്യുന്നു
    const supabaseAdmin = createAdminClient();

    const { data: todayLogs } = await supabaseAdmin
        .from("user_daily_ritual_logs")
        .select("ritual_id")
        .eq("user_id", user.id)
        .eq("completed_date", today);

    const completedCount = todayLogs?.length || 0;

    // Points threshold: 2 completed = 5, 4 completed = 10
    let newDailyPoints = 0;
    if (completedCount >= 4) {
        newDailyPoints = 10;
    } else if (completedCount >= 2) {
        newDailyPoints = 5;
    }

    // ഇന്ന് ഈ reason-ൽ ഇതിന് മുൻപ് എത്ര പോയിന്റ് കൊടുത്തിരുന്നു? (ഇന്ത്യ സമയം പ്രകാരം ഇന്നത്തെ തുടക്കം)
    const kolkataDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const kolkataStart = new Date(kolkataDateStr);
    const startOfDay = new Date(kolkataStart.getTime() - (5.5 * 60 * 60 * 1000));

    const { data: existingEntries } = await supabaseAdmin
        .from("gamification_ledger")
        .select("id, points")
        .eq("user_id", user.id)
        .eq("reason", "Daily Ritual Milestone")
        .gte("created_at", startOfDay.toISOString());

    const oldPoints = existingEntries?.reduce((sum, e) => sum + e.points, 0) || 0;

    // പോയിന്റ് മാറ്റം ആവശ്യമാണെങ്കിൽ മാത്രം update ചെയ്യുന്നു
    if (newDailyPoints !== oldPoints) {
        // പഴയ entries delete ചെയ്യുന്നു
        if (existingEntries && existingEntries.length > 0) {
            const ids = existingEntries.map(e => e.id);
            await supabaseAdmin
                .from("gamification_ledger")
                .delete()
                .in("id", ids);
        }

        // പുതിയ entry insert ചെയ്യുന്നു (0 ആണെങ്കിൽ insert ചെയ്യേണ്ട)
        if (newDailyPoints > 0) {
            await supabaseAdmin
                .from("gamification_ledger")
                .insert({
                    user_id: user.id,
                    points: newDailyPoints,
                    reason: "Daily Ritual Milestone",
                    metadata: { completed_count: completedCount, date: today }
                });
        }

        // Profile score recalculate ചെയ്യുന്നു — ledger-ൽ നിന്ന് total sum എടുക്കുന്നു
        const { data: allLedger } = await supabaseAdmin
            .from("gamification_ledger")
            .select("points")
            .eq("user_id", user.id);

        const totalScore = allLedger?.reduce((sum, e) => sum + e.points, 0) || 0;

        await supabaseAdmin
            .from("profiles")
            .update({ gamification_score: totalScore })
            .eq("id", user.id);
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/my-journey");
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
