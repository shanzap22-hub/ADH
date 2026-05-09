import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import nextDynamic from "next/dynamic";
import { Clock, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// force-dynamic: user-specific data (auth, courses, feed) must always be fresh
export const dynamic = "force-dynamic";

// Simple skeletons for dashboard
const FeedSkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-44 w-full rounded-xl" />
            </div>
        ))}
    </div>
);

const CoursesListSkeleton = () => (
    <div className="space-y-3">
        {[1, 2].map(i => (
            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden">
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="p-3 space-y-2">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

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
    { loading: () => <Skeleton className="h-36 w-full rounded-2xl" /> }
);

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/");

    const courses = await getDashboardCourses(user.id);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // Fetch community posts
    const { data: posts } = await supabase
        .from("posts")
        .select(`
            id, content, image_url, link, created_at, is_pinned, author_id,
            post_tier_access ( tier ),
            author:profiles ( full_name, avatar_url )
        `)
        .order("is_pinned", { ascending: false })
        .order("created_at",  { ascending: false });

    // Tier access check
    const userTier = profile?.membership_tier || "bronze";
    const { data: tierSettings } = await supabase
        .from("tier_pricing")
        .select("has_community_feed_access")
        .eq("tier", userTier)
        .single();

    const hasFeedAccess = tierSettings?.has_community_feed_access !== false;

    let filteredPosts: any[] = [];
    if (hasFeedAccess) {
        filteredPosts = (posts || []).filter((post: any) => {
            const accesslist = post.post_tier_access || [];
            return accesslist.length === 0 || accesslist.some((a: any) => a.tier === userTier);
        });
    }

    // Live sessions
    const yesterdayDate = new Date();
    yesterdayDate.setHours(yesterdayDate.getHours() - 24);
    const yesterday = yesterdayDate.toISOString();

    const { data: weeklySessions } = await (supabase as any)
        .from("weekly_live_sessions")
        .select("*")
        .gte("scheduled_at", yesterday)
        .order("scheduled_at", { ascending: true })
        .limit(5);

    const { data: bookings } = await supabase
        .from("bookings")
        .select("*, profiles:instructor_id(full_name)")
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .gte("start_time", yesterday)
        .order("start_time", { ascending: true })
        .limit(5);

    // Stats
    const coursesInProgress  = courses.filter(c => (c.progress ?? 0) < 100);
    const totalChapters      = courses.reduce((acc, c) => acc + c.chapters.length, 0);
    const completedChapters  = courses.reduce((acc, c) => {
        const p = c.progress ?? 0;
        return acc + Math.round((p / 100) * c.chapters.length);
    }, 0);

    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            <div className="p-4 md:p-8">
                <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-8">

                    {/* Main Feed Column */}
                    <div className="lg:col-span-8 space-y-5">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">
                                Community Feed
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                See what's happening in ADH Connect
                            </p>
                        </div>

                        <LiveSessionsBanner
                            weeklySessions={weeklySessions || []}
                            bookings={bookings || []}
                        />
                        <FeedView posts={filteredPosts} isAdmin={false} currentUserId={user.id} limit={3} />
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-5">
                        <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white relative">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xl">Welcome back,</CardTitle>
                                <p className="text-primary-foreground/90 font-medium">
                                    {profile?.full_name?.split(" ")[0] || "Student"}!
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-2 p-4 bg-black/20 rounded-xl backdrop-blur-sm">
                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                        <span>Progress</span>
                                        <span>{Math.round((completedChapters / (totalChapters || 1)) * 100)}%</span>
                                    </div>
                                    <Progress
                                        value={(completedChapters / (totalChapters || 1)) * 100}
                                        className="h-2 bg-black/20 [&>div]:bg-white"
                                    />
                                </div>
                            </CardContent>
                        </Card>

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
                                <div className="text-center p-8 border border-dashed border-violet-200 rounded-2xl bg-violet-50/50">
                                    <p className="text-sm text-slate-500">No courses in progress</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
