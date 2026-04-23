import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, BookOpen, Users, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getInstructorCourses } from "@/actions/get-instructor-courses";
import { InstructorCourseCard } from "@/components/instructor-course-card";

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export default async function CoursesPage() {
    let courses: any[] = [];
    let userId: string = "";

    try {
        console.log("[COURSES_PAGE] Starting data fetch");
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error("[COURSES_PAGE] Auth error or no user:", authError);
            return redirect("/login");
        }

        userId = user.id;
        courses = await getInstructorCourses(userId);
        console.log("[COURSES_PAGE] Courses fetched:", courses.length);
    } catch (error) {
        console.error("[COURSES_PAGE] Fatal error during fetch:", error);
        return redirect("/login");
    }

    const publishedCount = courses.filter(c => c.is_published).length;
    const draftCount = courses.length - publishedCount;

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                        My Courses
                    </h1>
                    <p className="text-slate-400 mt-1">Manage and create your courses</p>
                </div>
                <Link href="/instructor/create">
                    <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-orange-500/20">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        New Course
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm border border-blue-500/20 p-6 hover:border-blue-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Total Courses</p>
                            <p className="text-3xl font-bold text-white">{courses.length}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Published</p>
                            <p className="text-3xl font-bold text-white">{publishedCount}</p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm border border-orange-500/20 p-6 hover:border-orange-500/40 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
                    <div className="relative z-10 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400 font-medium">Drafts</p>
                            <p className="text-3xl font-bold text-white">{draftCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length === 0 ? (
                <div className="flex h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-900/30 backdrop-blur-sm">
                    <div className="text-center space-y-4">
                        <BookOpen className="h-16 w-16 text-slate-600 mx-auto" />
                        <div>
                            <p className="text-lg font-semibold text-slate-300">No courses yet</p>
                            <p className="text-slate-500 mt-1">Create your first course to get started!</p>
                        </div>
                        <Link href="/instructor/create">
                            <Button className="mt-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Create Course
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <InstructorCourseCard
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            imageUrl={course.image_url}
                            chaptersLength={course.chapter_count}
                            price={course.price}
                            isPublished={course.is_published}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
