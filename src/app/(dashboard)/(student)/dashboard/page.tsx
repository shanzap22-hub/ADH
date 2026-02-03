

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { FeedView } from "@/components/community/FeedView";
import { LiveSessionsBanner } from "@/components/community/LiveSessionsBanner";
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
            *,
            post_tier_access ( tier ),
            author:profiles ( full_name, avatar_url )
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    // Fetch Live Sessions (buffer -24h)
    const yesterday = new Date(Date.now() - 86400000).toISOString();

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
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Feed Column (Left) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 bg-clip-text text-transparent tracking-tight">Community Feed</h1>
                            <p className="text-slate-500">See what's happening in ADH Connect</p>
                        </div>
                    </div>

                    <LiveSessionsBanner
                        weeklySessions={weeklySessions || []}
                        bookings={bookings || []}
                    />
                    <FeedView posts={posts || []} isAdmin={false} currentUserId={user.id} />
                </div>

                {/* Sidebar Column (Right) - Stats & Learning */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Welcome / Stats Card */}
                    <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white relative">
                        {/* Decorative Background Circles */}
                        <div className="absolute top-[-50%] right-[-50%] w-full h-full rounded-full bg-white/10 blur-3xl pointer-events-none" />

                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Welcome back,</CardTitle>
                                    <p className="text-indigo-100 font-medium">{profile?.full_name?.split(' ')[0] || "Student"}!</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="mt-4 p-4 bg-black/20 rounded-xl backdrop-blur-sm">
                                <div className="flex justify-between text-sm mb-2 text-indigo-100 font-medium">
                                    <span>Overall Progress</span>
                                    <span>{Math.round((completedChapters / (totalChapters || 1)) * 100)}%</span>
                                </div>
                                <Progress value={(completedChapters / (totalChapters || 1)) * 100} className="h-2 bg-black/20 [&>div]:bg-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm text-center border border-white/10">
                                    <BookOpen className="w-5 h-5 mx-auto text-indigo-200 mb-1" />
                                    <div className="text-xl font-bold">{coursesInProgress.length}</div>
                                    <div className="text-[10px] uppercase text-indigo-200 font-bold tracking-wider">In Progress</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm text-center border border-white/10">
                                    <TrendingUp className="w-5 h-5 mx-auto text-emerald-300 mb-1" />
                                    <div className="text-xl font-bold">{completedChapters}</div>
                                    <div className="text-[10px] uppercase text-indigo-200 font-bold tracking-wider">Chapters Done</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Continue Learning */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                Continue Learning
                            </h3>
                            <Link href="/courses">
                                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">View All</Button>
                            </Link>
                        </div>

                        {coursesInProgress.length > 0 ? (
                            <CoursesList items={coursesInProgress.slice(0, 3)} />
                        ) : (
                            <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl bg-white">
                                <p className="text-sm text-slate-500 font-medium">No courses in progress</p>
                                <Link href="/courses" className="text-sm font-bold text-indigo-600 hover:underline mt-2 inline-block">Browse Courses</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
