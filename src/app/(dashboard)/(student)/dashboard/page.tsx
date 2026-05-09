import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import nextDynamic from "next/dynamic";
import { Clock, Sparkles, BookOpen, TrendingUp, ChevronRight, ArrowRight } from "lucide-react";
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
            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        ))}
    </div>
);

const CoursesListSkeleton = () => (
    <div className="space-y-3">
        {[1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden flex gap-3 p-3">
                <Skeleton className="h-16 w-24 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
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
    { loading: () => <Skeleton className="h-28 w-full rounded-2xl" /> }
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
    const totalChapters     = courses.reduce((acc, c) => acc + c.chapters.length, 0);
    const completedChapters = courses.reduce((acc, c) => {
        return acc + Math.round(((c.progress ?? 0) / 100) * c.chapters.length);
    }, 0);
    const overallPercent = Math.round((completedChapters / (totalChapters || 1)) * 100);

    const firstName = profile?.full_name?.split(" ")[0] || "Student";

    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            {/* ─────────────────────────── MOBILE LAYOUT ─────────────────────── */}
            <div className="md:hidden px-4 pt-4 space-y-4">

                {/* 1. Compact Stats Card */}
                <div className="rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-4 text-white shadow-lg shadow-violet-500/20 relative overflow-hidden">
                    {/* Decorative blob */}
                    <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-white/70 text-xs font-medium">Welcome back 👋</p>
                            <h2 className="text-lg font-bold mt-0.5">{firstName}!</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-center">
                                <div className="text-xl font-bold">{coursesInProgress.length}</div>
                                <div className="text-[10px] text-white/70 font-medium">Active</div>
                            </div>
                            <div className="w-px h-8 bg-white/20" />
                            <div className="text-center">
                                <div className="text-xl font-bold">{overallPercent}%</div>
                                <div className="text-[10px] text-white/70 font-medium">Progress</div>
                            </div>
                        </div>
                    </div>

                    {/* Thin progress bar */}
                    <div className="mt-3 bg-white/20 rounded-full h-1.5 relative z-10">
                        <div
                            className="bg-white rounded-full h-1.5 transition-all duration-700"
                            style={{ width: `${overallPercent}%` }}
                        />
                    </div>
                </div>

                {/* 2. Live Sessions Banner */}
                <LiveSessionsBanner
                    weeklySessions={weeklySessions || []}
                    bookings={bookings || []}
                />

                {/* 3. Community Feed — 3 posts */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                            Community Feed
                        </h2>
                    </div>
                    <FeedView posts={filteredPosts} isAdmin={false} currentUserId={user.id} limit={3} />
                </div>

                {/* 4. See More button */}
                {filteredPosts.length > 3 && (
                    <Link href="/community">
                        <button className="w-full py-3 rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                            See All Posts ({filteredPosts.length})
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </Link>
                )}

                {/* 5. Continue Learning */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-violet-500" />
                            Continue Learning
                        </h2>
                        <Link href="/courses">
                            <Button variant="ghost" size="sm" className="text-violet-600 dark:text-violet-400 h-8 text-xs px-2">
                                View All
                            </Button>
                        </Link>
                    </div>
                    {coursesInProgress.length > 0 ? (
                        <CoursesList items={coursesInProgress.slice(0, 3) as any[]} />
                    ) : (
                        <div className="text-center py-8 rounded-2xl border border-dashed border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20">
                            <BookOpen className="w-7 h-7 text-violet-300 dark:text-violet-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">No courses in progress</p>
                            <Link href="/courses" className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline mt-1 inline-block">
                                Browse Courses →
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ─────────────────────────── DESKTOP LAYOUT ─────────────────────── */}
            <div className="hidden md:block p-8">
                <div className="grid grid-cols-12 gap-8">

                    {/* Left — Feed */}
                    <div className="col-span-8 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
                                Community Feed
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                See what's happening in ADH Connect
                            </p>
                        </div>
                        <LiveSessionsBanner weeklySessions={weeklySessions || []} bookings={bookings || []} />
                        <FeedView posts={filteredPosts} isAdmin={false} currentUserId={user.id} limit={3} />
                        {filteredPosts.length > 3 && (
                            <Link href="/community">
                                <Button variant="outline" className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 font-semibold">
                                    View All Posts ({filteredPosts.length}) →
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Right — Stats + Learning */}
                    <div className="col-span-4 space-y-6">
                        {/* Welcome Card */}
                        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white relative">
                            <div className="absolute top-[-50%] right-[-50%] w-full h-full rounded-full bg-white/10 blur-3xl pointer-events-none" />
                            <CardContent className="p-5 relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white/70 text-xs">Welcome back</p>
                                        <p className="font-bold text-lg">{firstName}!</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-black/20 rounded-xl backdrop-blur-sm mb-3">
                                    <div className="flex justify-between text-xs mb-1.5 text-white/80 font-medium">
                                        <span>Overall Progress</span>
                                        <span>{overallPercent}%</span>
                                    </div>
                                    <Progress value={overallPercent} className="h-1.5 bg-black/20 [&>div]:bg-white" />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/10 p-2.5 rounded-xl text-center border border-white/10">
                                        <BookOpen className="w-4 h-4 mx-auto text-white/80 mb-1" />
                                        <div className="text-lg font-bold">{coursesInProgress.length}</div>
                                        <div className="text-[9px] uppercase text-white/60 font-bold tracking-wider">In Progress</div>
                                    </div>
                                    <div className="bg-white/10 p-2.5 rounded-xl text-center border border-white/10">
                                        <TrendingUp className="w-4 h-4 mx-auto text-white/80 mb-1" />
                                        <div className="text-lg font-bold">{completedChapters}</div>
                                        <div className="text-[9px] uppercase text-white/60 font-bold tracking-wider">Chapters Done</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Continue Learning */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-violet-500" />
                                    Continue Learning
                                </h3>
                                <Link href="/courses">
                                    <Button variant="ghost" size="sm" className="text-violet-600 dark:text-violet-400 h-8 text-xs px-2">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                            {coursesInProgress.length > 0 ? (
                                <CoursesList items={coursesInProgress.slice(0, 3) as any[]} />
                            ) : (
                                <div className="text-center p-6 border border-dashed border-violet-200 dark:border-violet-800/50 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20">
                                    <BookOpen className="w-7 h-7 text-violet-300 dark:text-violet-700 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No courses in progress</p>
                                    <Link href="/courses" className="text-sm font-bold text-violet-600 hover:underline mt-1 inline-block">
                                        Browse Courses →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
