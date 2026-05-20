import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Target, Users, Settings } from "lucide-react";
import { MyJourneyTracker } from "@/components/admin/MyJourneyTracker";
import { UserJourneyManager } from "@/components/admin/UserJourneyManager";
import { RitualEditor } from "@/components/admin/RitualEditor";
import { MilestoneConfig } from "@/components/admin/MilestoneConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ date?: string }>;
}

export default async function AdminMyJourneyTrackerPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    // Check if admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        return redirect("/dashboard");
    }

    const supabaseAdmin = createAdminClient();

    // Fetch all active rituals for Tracker
    const { data: activeRitualsData } = await supabaseAdmin
        .from("daily_rituals")
        .select("id, ritual_name")
        .eq("is_active", true)
        .order("created_at");

    const activeRituals = activeRitualsData || [];

    // Fetch ALL rituals for Config
    const { data: allRituals } = await supabaseAdmin
        .from("daily_rituals")
        .select("*")
        .order("created_at");

    // Fetch students
    const { data: profilesData } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, gamification_score")
        .eq("role", "student")
        .order("full_name");

    const studentIds = (profilesData || []).map(p => p.id);

    // Fetch income targets manually to avoid join schema issues
    const { data: incomeData } = await supabaseAdmin
        .from("user_income_targets")
        .select("user_id, current_amount, target_amount")
        .in("user_id", studentIds);

    // Fetch milestones manually
    const { data: milestonesData } = await supabaseAdmin
        .from("user_milestones")
        .select("user_id, milestone_name")
        .in("user_id", studentIds);

    // Map the relationships
    const studentsData = (profilesData || []).map(profile => {
        const user_income_targets = (incomeData || []).filter(i => i.user_id === profile.id);
        const user_milestones = (milestonesData || []).filter(m => m.user_id === profile.id);
        return {
            ...profile,
            user_income_targets,
            user_milestones
        };
    });

    // Fetch ritual logs for the selected date
    const selectedDate = resolvedParams.date || new Date().toISOString().split('T')[0];
    const { data: dateLogs } = await supabaseAdmin
        .from("user_daily_ritual_logs")
        .select("user_id, ritual_id")
        .eq("completed_date", selectedDate);

    // Map logs to students for Tracker
    const students = (studentsData || []).map(student => {
        const completedRituals = (dateLogs || [])
            .filter(log => log.user_id === student.id)
            .map(log => log.ritual_id);
            
        const progress_percentage = activeRituals.length > 0 
            ? (completedRituals.length / activeRituals.length) * 100 
            : 0;

        return {
            id: student.id,
            full_name: student.full_name || "Unknown",
            email: student.email || "",
            gamification_score: student.gamification_score || 0,
            completed_rituals: completedRituals,
            progress_percentage
        };
    });

    // Fetch milestones config
    const { data: config } = await supabaseAdmin
        .from("journey_config")
        .select("value")
        .eq("key", "milestones")
        .single();

    const milestones = (config?.value as string[]) || [
        "Starter",
        "10 Days Video",
        "Freedom Finisher",
        "HOF",
        "1 Cr Champion"
    ];

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">My Journey Tracker & Config</h1>
                        <p className="text-sm text-slate-500">Monitor daily student progress and manage journey settings</p>
                    </div>
                </div>
                <MilestoneConfig initialMilestones={milestones} />
            </div>

            <Tabs defaultValue="tracker" className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="tracker" className="rounded-lg">Daily Tracker</TabsTrigger>
                    <TabsTrigger value="config" className="rounded-lg">Targets & Rituals Config</TabsTrigger>
                </TabsList>

                <TabsContent value="tracker" className="m-0 border-none p-0 outline-none">
                    <MyJourneyTracker students={students} rituals={activeRituals} selectedDate={selectedDate} />
                </TabsContent>

                <TabsContent value="config" className="m-0 border-none p-0 outline-none">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        {/* Users List - Left Side (2/3) */}
                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-500" />
                                    Student Targets & Milestones
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Current Rank</TableHead>
                                            <TableHead>Current Revenue</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studentsData?.map((student: any) => {
                                            const latestMilestone = student.user_milestones?.[student.user_milestones.length - 1]?.milestone_name || 'Starter';
                                            const income = student.user_income_targets?.[0];

                                            return (
                                                <TableRow key={student.id}>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-bold">{student.full_name}</p>
                                                            <p className="text-xs text-slate-500">{student.email}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                                            {latestMilestone}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-mono font-bold">₹{income?.current_amount || 0}</p>
                                                        <p className="text-[10px] text-slate-400">Target: ₹{income?.target_amount || 100000}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <UserJourneyManager 
                                                            userId={student.id}
                                                            userName={student.full_name || ""}
                                                            currentRevenue={Number(income?.current_amount || 0)}
                                                            currentTarget={Number(income?.target_amount || 100000)}
                                                            currentMilestone={latestMilestone}
                                                            availableMilestones={milestones}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Rituals Management - Right Side (1/3) */}
                        <Card className="xl:col-span-1 border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-indigo-500" />
                                    Daily Rituals
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {allRituals?.map((ritual) => (
                                    <div key={ritual.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                                        <div>
                                            <p className="text-sm font-bold">{ritual.ritual_name}</p>
                                            <p className={ritual.is_active ? "text-[10px] text-emerald-500 font-bold uppercase" : "text-[10px] text-slate-400 uppercase"}>
                                                {ritual.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                            {ritual.audio_url && (
                                                <p className="text-[9px] text-indigo-500 mt-1 truncate max-w-[150px]">
                                                    Audio: {ritual.audio_url}
                                                </p>
                                            )}
                                        </div>
                                        <RitualEditor ritual={ritual} />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
