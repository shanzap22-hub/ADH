import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AchievementJourney } from "@/components/journey/AchievementJourney";
import { RevenueLadder } from "@/components/journey/RevenueLadder";
import { DailyRituals } from "@/components/journey/DailyRituals";
import { MembershipBadge } from "@/components/membership/MembershipBadge";
import { GraduationCap, TrendingUp, Sparkles } from "lucide-react";
import { GoBackButton } from "@/components/ui/go-back-button";

export const dynamic = 'force-dynamic';

export default async function MyJourneyPage() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
        return redirect("/");
    }

    // Fetch Profile & Membership
    const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier, full_name, gamification_score")
        .eq("id", user.id)
        .single();

    const currentTier = profile?.membership_tier || "free";

    // Check Tier Permissions
    const { data: tierFeature } = await supabase
        .from("tier_pricing")
        .select("has_my_journey_access")
        .eq("tier", currentTier)
        .single();

    // Give default true if the tier doesn't exist yet to prevent breaking
    const hasAccess = tierFeature?.has_my_journey_access ?? true;
    
    if (!hasAccess && profile?.role !== "super_admin") {
        return redirect("/dashboard?error=upgrade_required_for_journey");
    }

    // Fetch/Initialize Income Target
    let { data: incomeData } = await supabase
        .from("user_income_targets")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!incomeData) {
        const { data: newData } = await supabase
            .from("user_income_targets")
            .insert({ user_id: user.id, target_amount: 100000, current_amount: 0 })
            .select()
            .single();
        incomeData = newData;
    }

    // Fetch milestones config
    const { data: config } = await supabase
        .from("journey_config")
        .select("value")
        .eq("key", "milestones")
        .single();

    const availableMilestones = (config?.value as string[]) || [
        "Starter",
        "10 Days Video",
        "Freedom Finisher",
        "HOF",
        "1 Cr Champion"
    ];

    // Fetch/Initialize Milestones
    let { data: milestones } = await supabase
        .from("user_milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (!milestones || milestones.length === 0) {
        const { data: newMilestone } = await supabase
            .from("user_milestones")
            .insert({ user_id: user.id, milestone_name: availableMilestones[0], is_completed: true, completed_at: new Date().toISOString() })
            .select();
        milestones = newMilestone || [];
    }

    // Fetch Daily Rituals & Today's Logs
    const { data: allRituals } = await supabase
        .from("daily_rituals")
        .select("*")
        .eq("is_active", true);

    const formatter = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Kolkata',
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    const today = formatter.format(new Date());

    const { data: todayLogs } = await supabase
        .from("user_daily_ritual_logs")
        .select("ritual_id")
        .eq("user_id", user.id)
        .eq("completed_date", today);

    const completedRitualIds = new Set(todayLogs?.map(l => l.ritual_id) || []);
    
    const ritualData = allRituals?.map(r => ({
        id: r.id,
        ritual_name: r.ritual_name,
        audio_url: r.audio_url,
        is_completed: completedRitualIds.has(r.id)
    })) || [];

    const tierNames: Record<string, string> = {
        free: "Free Member",
        bronze: "Bronze Member",
        silver: "Silver Member",
        gold: "Gold Member",
        platinum: "Platinum Member",
        diamond: "Diamond Member"
    };

    const currentTierName = tierNames[profile?.membership_tier || "free"] || "Member";

    // Progress Calculation
    const ritualProgress = ritualData.length > 0 ? (ritualData.filter(r => r.is_completed).length / ritualData.length) : 0;
    const overallProgress = ritualProgress * 100;

    return (
        <div className="px-6 pt-4 pb-6 space-y-8 max-w-7xl mx-auto md:pb-24">
            <GoBackButton />
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                            My Journey
                            <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            Welcome back, <span className="text-violet-600 dark:text-violet-400 font-bold">{profile?.full_name || "Champion"}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Rank Status</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{currentTierName}</p>
                        </div>
                        <MembershipBadge tier={profile?.membership_tier || "bronze"} size="lg" />
                    </div>

                    <div className="hidden lg:flex flex-col items-center bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-2xl shadow-xl shadow-amber-500/5 px-6">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1">🏆 Points</span>
                        <span className="text-xl font-black">{profile?.gamification_score || 0}</span>
                    </div>

                    <div className="hidden lg:flex flex-col items-center bg-violet-600 text-white p-3 rounded-2xl shadow-xl shadow-violet-500/20 px-6">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Daily Task Progress</span>
                        <span className="text-xl font-black">{Math.round(overallProgress)}%</span>
                    </div>
                </div>
            </div>

            {/* Achievement Timeline */}
            <AchievementJourney 
                currentLevelIndex={milestones.length} 
                milestoneNames={availableMilestones}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rituals - Left Side (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    <DailyRituals initialRituals={ritualData} />
                    
                    {/* Motivational Card */}
                    <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
                        <div className="relative z-10 space-y-4">
                            <h3 className="text-2xl font-black italic">"Success is not final, failure is not fatal: it is the courage to continue that counts."</h3>
                            <div className="flex items-center gap-2 text-violet-400 font-bold">
                                <TrendingUp className="h-5 w-5" />
                                <span>Keep pushing towards your goals</span>
                            </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-violet-600/20 blur-3xl rounded-full" />
                        <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-600/10 blur-3xl rounded-full" />
                    </div>
                </div>

                {/* Revenue Ladder - Right Side (1/3) */}
                <div className="lg:col-span-1">
                    <RevenueLadder currentIncome={Number(incomeData?.current_amount || 0)} />
                </div>
            </div>
        </div>
    );
}
