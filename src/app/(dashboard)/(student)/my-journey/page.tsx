import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import nextDynamic from "next/dynamic";
import { 
    Clock, Sparkles, BookOpen, TrendingUp, ChevronRight, 
    ArrowRight, CheckCircle2, Trophy, Flame, Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CoursesListSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
            <div key={i} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden flex gap-4 p-4 shadow-sm">
                <Skeleton className="h-20 w-32 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

const CoursesList = nextDynamic(
    () => import("@/components/courses-list").then(mod => mod.CoursesList),
    { loading: () => <CoursesListSkeleton /> }
);

export default async function MyJourneyPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const courses = await getDashboardCourses(user.id);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    const coursesInProgress = courses.filter(c => (c.progress ?? 0) < 100);
    const completedCoursesCount = courses.filter(c => (c.progress ?? 0) === 100).length;
    const totalChapters = courses.reduce((acc, c) => acc + c.chapters.length, 0);
    const completedChapters = courses.reduce((acc, c) => {
        return acc + Math.round(((c.progress ?? 0) / 100) * c.chapters.length);
    }, 0);
    const overallPercent = Math.round((completedChapters / (totalChapters || 1)) * 100);

    const firstName = profile?.full_name?.split(" ")[0] || "Student";

    const milestones = [
        { label: "Started", icon: Target, completed: true, color: "text-emerald-500 bg-emerald-500/10" },
        { label: "First Lesson", icon: BookOpen, completed: completedChapters > 0, color: "text-blue-500 bg-blue-500/10" },
        { label: "Active", icon: Flame, completed: coursesInProgress.length > 0, color: "text-orange-500 bg-orange-500/10" },
        { label: "Mastery", icon: Trophy, completed: completedCoursesCount > 0, color: "text-purple-500 bg-purple-500/10" },
    ];

    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
                
                {/* Achievement Header */}
                <div className="space-y-6 text-center md:text-left">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
                            Your Achievement Journey
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                            Track your progress and reach your milestones
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 py-4">
                        {milestones.map((m, i) => {
                            const Icon = m.icon;
                            return (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <div className={cn(
                                        "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-xl relative",
                                        m.completed 
                                            ? cn(m.color, "shadow-current/20 scale-110 border-2 border-white dark:border-slate-800") 
                                            : "bg-white dark:bg-slate-900 text-slate-200 dark:text-slate-800 border-2 border-dashed border-slate-100"
                                    )}>
                                        <Icon className={cn("h-7 w-7 stroke-[2.5]", m.completed ? "" : "opacity-30")} />
                                        {m.completed && (
                                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                                                <CheckCircle2 className="h-3 w-3 fill-current" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[11px] font-black uppercase tracking-[0.15em]",
                                        m.completed ? "text-slate-900 dark:text-white" : "text-slate-400"
                                    )}>{m.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Progress Card */}
                <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-700 text-white relative p-1">
                    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-[120px] pointer-events-none" />
                    <CardContent className="p-8 md:p-12 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left space-y-4">
                                <div className="space-y-1">
                                    <p className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">Overall Progress</p>
                                    <h3 className="text-6xl md:text-8xl font-black tracking-tighter">{overallPercent}%</h3>
                                </div>
                                <div className="flex gap-4 justify-center md:justify-start">
                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs font-bold">
                                        {completedChapters} Chapters
                                    </div>
                                    <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-xs font-bold">
                                        {completedCoursesCount} Mastery
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 w-full max-w-md space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white/70">
                                        <span>Current Level</span>
                                        <span>{overallPercent < 30 ? "Beginner" : overallPercent < 70 ? "Intermediate" : "Master"}</span>
                                    </div>
                                    <Progress 
                                        value={overallPercent} 
                                        className="h-4 bg-black/20 rounded-full [&>div]:bg-white" 
                                    />
                                </div>
                                <p className="text-sm text-white/80 font-medium leading-relaxed italic">
                                    "Your journey of a thousand miles begins with a single step. Keep pushing forward, {firstName}!"
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Courses Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-violet-600 rounded-full" />
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Resume Your Learning</h2>
                    </div>
                    
                    {coursesInProgress.length > 0 ? (
                        <CoursesList items={coursesInProgress as any[]} />
                    ) : (
                        <div className="text-center p-20 rounded-[40px] border-2 border-dashed border-violet-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-black/5">
                            <BookOpen className="w-16 h-16 text-violet-200 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Active Courses</h3>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Time to start a new chapter in your digital career!</p>
                            <Link href="/courses">
                                <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-10 h-14 shadow-2xl shadow-violet-500/40 transition-all active:scale-95">
                                    Browse Courses
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Daily Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200/60 shadow-xl shadow-black/5">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-[20px] bg-orange-500/10 flex items-center justify-center">
                                <Target className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Daily Rituals</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Boost your skills daily</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: "Watch 1 Lesson", xp: "+50 XP", done: completedChapters > 0 },
                                { label: "Join Community Chat", xp: "+20 XP", done: false },
                                { label: "Practice Skills", xp: "+100 XP", done: false }
                            ].map((task, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-3xl bg-slate-500/5 border border-transparent hover:border-slate-200/40 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            task.done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-slate-700"
                                        )}>
                                            {task.done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                        </div>
                                        <span className={cn("text-sm font-bold", task.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300")}>
                                            {task.label}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 px-3 py-1 rounded-full">{task.xp}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl shadow-black/20 flex flex-col justify-center items-center text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Trophy className="h-10 w-10 text-yellow-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight">Become a Master</h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Complete your current courses to unlock exclusive ADH Mastery badges and rewards.
                            </p>
                        </div>
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest px-8">
                            View Achievements
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
}
