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

// force-dynamic: user-specific data
export const dynamic = "force-dynamic";

// ── Skeleton fallbacks ────────────────────────────────────────────
const FeedSkeleton = () => (
    <div className="space-y-3">
        {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/30 p-5 space-y-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
        ))}
    </div>
);

const CoursesListSkeleton = () => (
    <div className="space-y-3">
        {[1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden flex gap-4 p-3 shadow-sm">
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

// ── Dynamic imports ───────────────────────────────────────────────
const CoursesList = nextDynamic(
    () => import("@/components/courses-list").then(mod => mod.CoursesList),
    { loading: () => <CoursesListSkeleton /> }
);

const FeedView = nextDynamic(
    () => import("@/components/community/FeedView").then(mod => mod.FeedView),
    { loading: () => <FeedSkeleton /> }
);

const LiveSessionsBanner = nextDynamic(
    () => import("@/components/community/LiveSessionsBanner").then(mod => mod.LiveSessionsBanner),
    { loading: () => <Skeleton className="h-32 w-full rounded-3xl" /> }
);

// ── Page ──────────────────────────────────────────────────────────
export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/");

    const courses = await getDashboardCourses(user.id);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // Posts
    const { data: posts } = await supabase
        .from("posts")
        .select(`id, content, image_url, link, created_at, is_pinned, author_id,
                 post_tier_access ( tier ),
                 author:profiles ( full_name, avatar_url )`)
        .order("is_pinned", { ascending: false })
        .order("created_at",  { ascending: false });

    // Tier access
    const userTier = profile?.membership_tier || "bronze";
    const { data: tierSettings } = await supabase
        .from("tier_pricing").select("has_community_feed_access")
        .eq("tier", userTier).single();

    const hasFeedAccess = tierSettings?.has_community_feed_access !== false;

    let filteredPosts: any[] = [];
    if (hasFeedAccess) {
        filteredPosts = (posts || []).filter((post: any) => {
            const access = post.post_tier_access || [];
            return access.length === 0 || access.some((a: any) => a.tier === userTier);
        });
    }

    // Live sessions
    const yesterdayDate = new Date();
    yesterdayDate.setHours(yesterdayDate.getHours() - 24);
    const yesterday = yesterdayDate.toISOString();

    const { data: weeklySessions } = await (supabase as any)
        .from("weekly_live_sessions").select("*")
        .gte("scheduled_at", yesterday).order("scheduled_at", { ascending: true }).limit(5);

    const { data: bookings } = await supabase
        .from("bookings").select("*, profiles:instructor_id(full_name)")
        .eq("user_id", user.id).eq("status", "confirmed")
        .gte("start_time", yesterday).order("start_time", { ascending: true }).limit(5);

    // Stats
    const coursesInProgress = courses.filter(c => (c.progress ?? 0) < 100);
    const completedCoursesCount = courses.filter(c => (c.progress ?? 0) === 100).length;
    const totalChapters     = courses.reduce((acc, c) => acc + c.chapters.length, 0);
    const completedChapters = courses.reduce((acc, c) => {
        return acc + Math.round(((c.progress ?? 0) / 100) * c.chapters.length);
    }, 0);
    const overallPercent = Math.round((completedChapters / (totalChapters || 1)) * 100);

    const firstName = profile?.full_name?.split(" ")[0] || "Student";

    // ── Learning Milestones (Inspiration from Calzol) ───────────────
    const milestones = [
        { label: "Started", icon: Target, completed: true, color: "text-emerald-500 bg-emerald-500/10" },
        { label: "First Lesson", icon: BookOpen, completed: completedChapters > 0, color: "text-blue-500 bg-blue-500/10" },
        { label: "Active", icon: Flame, completed: coursesInProgress.length > 0, color: "text-orange-500 bg-orange-500/10" },
        { label: "Mastery", icon: Trophy, completed: completedCoursesCount > 0, color: "text-purple-500 bg-purple-500/10" },
    ];

    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
                
                {/* 1. Ultra-Premium Header with Milestones */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
                                Hello, {firstName}!
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                                Ready to scale your digital income today?
                            </p>
                        </div>

                        {/* Achievement Journey (Mobile Friendly) */}
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {milestones.map((m, i) => {
                                const Icon = m.icon;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                                            m.completed 
                                                ? cn(m.color, "shadow-current/20 scale-110") 
                                                : "bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-700 grayscale opacity-50"
                                        )}>
                                            <Icon className="h-6 w-6 stroke-[2.5]" />
                                            {m.completed && (
                                                <div className="absolute -top-1 -right-1 bg-white dark:bg-slate-900 rounded-full">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-white dark:fill-slate-900" />
                                                </div>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-wider",
                                            m.completed ? "text-slate-900 dark:text-white" : "text-slate-400"
                                        )}>{m.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Compact Hero Stat Card */}
                    <Card className="lg:w-[400px] overflow-hidden border-none shadow-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-fuchsia-700 text-white relative group">
                        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-[100px] pointer-events-none group-hover:bg-white/20 transition-all duration-700" />
                        <CardContent className="p-6 relative z-10 flex flex-col justify-between h-full">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Global Progress</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{overallPercent}%</h3>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            
                            <div className="mt-8 space-y-4">
                                <Progress 
                                    value={overallPercent} 
                                    className="h-2.5 bg-black/20 [&>div]:bg-gradient-to-r [&>div]:from-white [&>div]:to-white/80" 
                                />
                                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-white/70">
                                    <span>{completedChapters} Chapters Done</span>
                                    <span>{totalChapters - completedChapters} Remaining</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Live Banner with Glass Effect */}
                        <LiveSessionsBanner
                            weeklySessions={weeklySessions || []}
                            bookings={bookings || []}
                        />

                        {/* Feed Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-8 bg-violet-600 rounded-full" />
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Community Feed</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Latest from ADH Connect</p>
                                    </div>
                                </div>
                                <Link href="/community">
                                    <Button variant="ghost" className="text-violet-600 dark:text-violet-400 font-black text-xs uppercase tracking-widest hover:bg-violet-500/5">
                                        View All Posts
                                    </Button>
                                </Link>
                            </div>
                            <FeedView posts={filteredPosts} isAdmin={false} currentUserId={user.id} limit={3} />
                        </div>
                    </div>

                    {/* Learning Sidebar (Right) */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Continue Learning Card */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Active Courses</h2>
                            </div>
                            
                            {coursesInProgress.length > 0 ? (
                                <CoursesList items={coursesInProgress.slice(0, 3) as any[]} />
                            ) : (
                                <div className="text-center p-10 rounded-3xl border-2 border-dashed border-violet-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                    <BookOpen className="w-10 h-10 text-violet-200 dark:text-slate-800 mx-auto mb-4" />
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">No active courses yet.</p>
                                    <Link href="/courses">
                                        <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-6 h-12 shadow-xl shadow-violet-500/20 active:scale-95 transition-all">
                                            Start Learning
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Daily Rituals / Checklist (Inspired by Calzol) */}
                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/30 shadow-xl shadow-black/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight">Daily Rituals</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">0/3 Completed</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { label: "Watch 1 Lesson", xp: "+50 XP" },
                                    { label: "Post in Community", xp: "+20 XP" },
                                    { label: "Check Live Schedule", xp: "+10 XP" }
                                ].map((task, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/5 hover:bg-slate-500/10 transition-colors group cursor-pointer border border-transparent hover:border-slate-200/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-violet-500 transition-colors" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{task.label}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">{task.xp}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
