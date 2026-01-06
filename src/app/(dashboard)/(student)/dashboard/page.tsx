import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { CoursesList } from "@/components/courses-list";
import { FeedCard } from "@/components/dashboard/FeedCard";
import {
    CheckCircle,
    Clock,
    BookOpen,
    TrendingUp,
    Sparkles,
    Rocket,
    Award
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/");
    }

    // Get all courses for this user
    const courses = await getDashboardCourses(user.id);

    // Separate completed and in-progress courses
    const completedCourses = courses.filter(course => course.progress === 100);
    const coursesInProgress = courses.filter(course => (course.progress ?? 0) < 100);

    // Calculate stats
    const totalChapters = courses.reduce((acc, course) => acc + course.chapters.length, 0);
    const completedChapters = courses.reduce((acc, course) => {
        const progress = course.progress ?? 0;
        return acc + Math.round((progress / 100) * course.chapters.length);
    }, 0);

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* Welcome Card - Mobile Optimized */}
            <FeedCard
                title={`Welcome Back! 👋`}
                description="Continue your learning journey"
                icon={<Sparkles className="h-5 w-5 text-orange-500" />}
                className="bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 border-orange-200 dark:border-orange-800"
            >
                <div className="mt-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {completedChapters} of {totalChapters} chapters completed
                    </p>
                    <Progress
                        value={(completedChapters / totalChapters) * 100}
                        className="mt-2 h-2"
                    />
                </div>
            </FeedCard>

            {/* Quick Stats - Compact Mobile Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {/* In Progress */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{coursesInProgress.length}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">In Progress</p>
                        </div>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{completedCourses.length}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
                        </div>
                    </div>
                </div>

                {/* Total Courses */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{courses.length}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                        </div>
                    </div>
                </div>

                {/* Learning Hours */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalChapters}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Chapters</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-orange-500" />
                    Recent Activity
                </h2>

                {/* Sample Feed Items */}
                <FeedCard
                    title="Course Update"
                    description="New chapter added to your enrolled course"
                    icon={<BookOpen className="h-5 w-5 text-blue-500" />}
                >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        "Advanced Social Media Marketing" has a new chapter available!
                    </p>
                </FeedCard>

                {completedChapters > 0 && (
                    <FeedCard
                        title="Achievement Unlocked!"
                        description="Keep up the great work"
                        icon={<Award className="h-5 w-5 text-yellow-500" />}
                    >
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            You've completed {completedChapters} chapters this month! 🎉
                        </p>
                    </FeedCard>
                )}
            </div>

            {/* Continue Learning Section */}
            {coursesInProgress.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        Continue Learning
                    </h2>
                    <CoursesList items={coursesInProgress} />
                </div>
            )}

            {/* Completed Courses */}
            {completedCourses.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Completed Courses
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        {completedCourses.slice(0, 3).map((course) => (
                            <div
                                key={course.id}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{course.title}</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        Completed!
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {courses.length === 0 && (
                <FeedCard
                    title="Start Your Journey"
                    description="No courses yet"
                    icon={<Rocket className="h-5 w-5 text-orange-500" />}
                >
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Explore our courses and begin your learning adventure!
                    </p>
                </FeedCard>
            )}
        </div>
    );
}
