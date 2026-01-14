

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { FeedView } from "@/components/community/FeedView";
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

    // Separate completed and in-progress courses
    const coursesInProgress = courses.filter(course => (course.progress ?? 0) < 100);

    // Calculate stats
    const totalChapters = courses.reduce((acc, course) => acc + course.chapters.length, 0);
    const completedChapters = courses.reduce((acc, course) => {
        const progress = course.progress ?? 0;
        return acc + Math.round((progress / 100) * course.chapters.length);
    }, 0);

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Feed Column (Left) */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Community Feed</h1>
                    </div>

                    <FeedView posts={posts || []} isAdmin={false} currentUserId={user.id} />
                </div>

                {/* Sidebar Column (Right) - Stats & Learning */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Welcome / Stats Card */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" />
                                <CardTitle className="text-lg">Welcome, {profile?.full_name?.split(' ')[0] || "Student"}!</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between text-sm mb-2 text-slate-600 dark:text-slate-400">
                                <span>Total Progress</span>
                                <span>{Math.round((completedChapters / (totalChapters || 1)) * 100)}%</span>
                            </div>
                            <Progress value={(completedChapters / (totalChapters || 1)) * 100} className="h-2 mb-4" />

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                                    <BookOpen className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                                    <div className="text-lg font-bold">{coursesInProgress.length}</div>
                                    <div className="text-[10px] uppercase text-slate-500 font-bold">In Progress</div>
                                </div>
                                <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg text-center">
                                    <TrendingUp className="w-4 h-4 mx-auto text-green-500 mb-1" />
                                    <div className="text-lg font-bold">{completedChapters}</div>
                                    <div className="text-[10px] uppercase text-slate-500 font-bold">Chapters Done</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Continue Learning */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Continue Learning
                            </h3>
                            <Link href="/courses">
                                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                            </Link>
                        </div>

                        {coursesInProgress.length > 0 ? (
                            <CoursesList items={coursesInProgress.slice(0, 3)} />
                        ) : (
                            <div className="text-center p-6 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                <p className="text-sm text-slate-500">No courses in progress</p>
                                <Link href="/courses" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Browse Courses</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
