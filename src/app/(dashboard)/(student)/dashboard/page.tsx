
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import nextDynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton fallback for dynamic imports — shimmer effect
const FeedSkeleton = () => (
    <div className="space-y-4">
        {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-44 w-full rounded-xl" />
            </div>
        ))}
    </div>
);

const CoursesList = nextDynamic(() => import("@/components/courses-list").then(mod => mod.CoursesList), {
    loading: () => (
        <div className="space-y-3">
            {[1,2].map(i => (
                <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden">
                    <Skeleton className="aspect-video w-full rounded-none" />
                    <div className="p-3 space-y-2">
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
});

const FeedView = nextDynamic(() => import("@/components/community/FeedView").then(mod => mod.FeedView), {
    loading: () => <FeedSkeleton />,
});

const LiveSessionsBanner = nextDynamic(() => import("@/components/community/LiveSessionsBanner").then(mod => mod.LiveSessionsBanner), {
    loading: () => <Skeleton className="h-36 w-full rounded-2xl" />,
});
import {
    Clock,
    Sparkles,
    BookOpen,
    TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// force-dynamic: user-specific data (auth, courses, feed) must always be fresh
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/");
    }

    // Get all courses for this user
    const courses = await getDashboardCourses(user.id);
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // Fetch Posts for Feed
    const { data: posts } = await supabase
        .from("posts")
        .select(`
            id,
            content,
            image_url,
            link,
            created_at,
            is_pinned,
            author_id,
            post_tier_access ( tier ),
            author:profiles ( full_name, avatar_url )
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    // Check Feature Access (Admin Control)
    const userTier = profile?.membership_tier || "bronze";
    const { data: tierSettings } = await supabase
        .from("tier_pricing")
        .select("has_community_feed_access")
        .eq("tier", userTier)
        .single();

    const hasFeedAccess = tierSettings?.has_community_feed_access !== false; // Default true if missing

    // Filter Posts based on Tier Access:
    // 1. If post has NO tier restrictions (public) -> Show it.
    // 2. If post HAS restrictions -> User must have one of the allowed tiers.
    let filteredPosts: any[] = [];

    if (hasFeedAccess) {
        filteredPosts = (posts || []).filter((post: any) => {
            const accesslist = post.post_tier_access || [];
            if (accesslist.length === 0) return true;
            return accesslist.some((a: any) => a.tier === userTier);
        });
    }

    // Fetch Live Sessions (buffer -24h)
    const yesterdayDate = new Date();
    yesterdayDate.setHours(yesterdayDate.getHours() - 24);
    const yesterday = yesterdayDate.toISOString();

    const { data: weeklySessions } = await (supabase as any)
        .from('weekly_live_sessions')
        .select('*')
        .gte('scheduled_at', yesterday)
        .order('scheduled_at', { ascending: true })
        .limit(5);

    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, profiles:instructor_id(full_name)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('start_time', yesterday)
        .order('start_time', { ascending: true })
        .limit(5);

    // Separate completed and in-progress courses
    const coursesInProgress = courses.filter(course => (course.progress ?? 0) < 100);

    // Calculate stats
    const totalChapters = courses.reduce((acc, course) => acc + course.chapters.length, 0);
    const completedChapters = courses.reduce((acc, course) => {
        const progress = course.progress ?? 0;
        return acc + Math.round((progress / 100) * course.chapters.length);
    }, 0);

    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            <div className="p-4 md:p-8">
                <div className="flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Main Feed Column — shown second on mobile (flex-col-reverse puts this at bottom) */}
                <div className="lg:col-span-8 space-y-5">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent tracking-tight">Community Feed</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">See what's happening in ADH Connect</p>
                    </div>

                    <LiveSessionsBanner
                        weeklySessions={weeklySessions || []}
                        bookings={bookings || []}
                    />
                    <FeedView posts={filteredPosts} isAdmin={false} currentUserId={user.id} limit={3} />
                </div>

                {/* Sidebar Column — shown FIRST on mobile (flex-col-reverse reverses order) */}
                <div className="lg:col-span-4 space-y-5">
                    {/* Welcome / Stats Card */}
                    <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white relative">
                        {/* Decorative Background Circles */}
                        <div className="absolute top-[-50%] right-[-50%] w-full h-full rounded-full bg-white/10 blur-3xl pointer-events-none" />

                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Welcome back,</CardTitle>
                                    <p className="text-primary-foreground/90 font-medium">{profile?.full_name?.split(' ')[0] || "Student"}!</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="mt-4 p-4 bg-black/20 rounded-xl backdrop-blur-sm">
                                <div className="flex justify-between text-sm mb-2 text-primary-foreground/90 font-medium">
                                    <span>Overall Progress</span>
                                    <span>{Math.round((completedChapters / (totalChapters || 1)) * 100)}%</span>
                                </div>
                                <Progress value={(completedChapters / (totalChapters || 1)) * 100} className="h-2 bg-black/20 [&>div]:bg-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm text-center border border-white/10">
                                    <BookOpen className="w-5 h-5 mx-auto text-primary-foreground/80 mb-1" />
                                    <div className="text-xl font-bold">{coursesInProgress.length}</div>
                                    <div className="text-[10px] uppercase text-primary-foreground/70 font-bold tracking-wider">In Progress</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm text-center border border-white/10">
                                    <TrendingUp className="w-5 h-5 mx-auto text-primary-foreground/80 mb-1" />
                                    <div className="text-xl font-bold">{completedChapters}</div>
                                    <div className="text-[10px] uppercase text-primary-foreground/70 font-bold tracking-wider">Chapters Done</div>
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
                                <Button variant="ghost" size="sm" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 h-8 text-xs px-2">View All</Button>
                            </Link>
                        </div>

                        {coursesInProgress.length > 0 ? (
                            <CoursesList items={coursesInProgress.slice(0, 3) as any[]} />
                        ) : (
                            <div className="text-center p-8 border border-dashed border-violet-200 dark:border-violet-800/50 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20">
                                <BookOpen className="w-8 h-8 text-violet-300 dark:text-violet-700 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No courses in progress</p>
                                <Link href="/courses" className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline mt-2 inline-block">Browse Courses →</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
