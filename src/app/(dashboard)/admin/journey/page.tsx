import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Settings } from "lucide-react";
import { UserJourneyManager } from "@/components/admin/UserJourneyManager";
import { RitualEditor } from "@/components/admin/RitualEditor";
import { MilestoneConfig } from "@/components/admin/MilestoneConfig";

export const dynamic = 'force-dynamic';

export default async function AdminJourneyPage() {
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

    // Fetch all users with their journey data
    const { data: usersData } = await supabase
        .from("profiles")
        .select(`
            id, 
            full_name, 
            email,
            user_income_targets(current_amount, target_amount),
            user_milestones(milestone_name)
        `)
        .eq("role", "student")
        .order("full_name");

    // Fetch all rituals
    const { data: rituals } = await supabase
        .from("daily_rituals")
        .select("*")
        .order("created_at");

    // Fetch milestones config
    const { data: config } = await supabase
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
                    <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">Journey Management</h1>
                        <p className="text-sm text-slate-500">Manage user targets, milestones, and rituals</p>
                    </div>
                </div>
                <MilestoneConfig initialMilestones={milestones} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Users List - Left Side (2/3) */}
                <Card className="xl:col-span-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-violet-500" />
                            Student Progress
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
                                {usersData?.map((student) => {
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
                                                <Badge variant="outline" className="bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
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
                            <Settings className="h-5 w-5 text-violet-500" />
                            Daily Rituals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {rituals?.map((ritual) => (
                            <div key={ritual.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60">
                                <div>
                                    <p className="text-sm font-bold">{ritual.ritual_name}</p>
                                    <p className={ritual.is_active ? "text-[10px] text-emerald-500 font-bold uppercase" : "text-[10px] text-slate-400 uppercase"}>
                                        {ritual.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                    {ritual.audio_url && (
                                        <p className="text-[9px] text-violet-500 mt-1 truncate max-w-[150px]">
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
        </div>
    );
}
