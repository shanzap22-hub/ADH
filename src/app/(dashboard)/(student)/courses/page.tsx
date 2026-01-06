import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";
import { MobileLayout } from "@/components/dashboard/MobileLayout";
import { Search as SearchIcon, BookOpen } from "lucide-react";

export default async function CoursesPage() {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
        return redirect("/");
    }

    let courses: any[] = [];
    let fetchError = null;

    try {
        console.log("[COURSES_PAGE] Fetching courses for user:", user.id);

        // Fetch ALL published courses
        const { data, error } = await supabase
            .from("courses")
            .select(`
                *,
                chapters (
                    id
                )
            `)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[COURSES_PAGE] Database error:", error);
            fetchError = error.message;
        } else {
            console.log("[COURSES_PAGE] Fetched courses:", data?.length || 0);
            courses = data || [];
        }
    } catch (error: any) {
        console.error("[COURSES_PAGE] Exception:", error);
        fetchError = "Failed to load courses";
    }

    // Transform data
    const coursesWithData = courses.map((course: any) => ({
        ...course,
        category: null,
        chapters: course.chapters || [],
        progress: null,
    }));

    return (
        <MobileLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">All Courses</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
                        </p>
                    </div>
                </div>

                {/* Error State */}
                {fetchError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 dark:text-red-400 text-xl font-bold">!</span>
                            </div>
                            <div>
                                <p className="font-semibold text-red-900 dark:text-red-100">
                                    Failed to Load Courses
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    {fetchError}
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Courses List */}
                {!fetchError && <CoursesList items={coursesWithData} />}

                {/* Empty State */}
                {!fetchError && courses.length === 0 && (
                    <div className="text-center py-16 px-4">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-4">
                            <BookOpen className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Courses Available</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                            There are no published courses yet. Check back soon for new learning opportunities!
                        </p>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
