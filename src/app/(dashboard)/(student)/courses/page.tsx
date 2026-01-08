import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";
import { BookOpen, AlertCircle } from "lucide-react";

export default async function CoursesPage() {
    try {
        // Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("[COURSES_PAGE] Auth check:", { hasUser: !!user });

        if (!user || authError) {
            return redirect("/");
        }

        let courses: any[] = [];
        let fetchError: string | null = null;

        // Fetch courses with tier-based access
        try {
            const { getUserAccessibleCourses } = await import("@/actions/get-user-accessible-courses");
            courses = await getUserAccessibleCourses(user.id);
            console.log("[COURSES_PAGE] Fetched courses:", { count: courses.length });
        } catch (error: any) {
            console.error("[COURSES_PAGE] Exception:", error);
            fetchError = error.message;
            courses = [];
        }

        // Transform data
        const coursesWithData = courses.map((course: any) => ({
            id: course.id,
            title: course.title || "Untitled",
            description: course.description,
            image_url: course.image_url,
            price: course.price,
            category: course.category,
            chapters: course.chapters,
            progress: course.progress,
            isLocked: course.isLocked || false,
            requiredTier: course.requiredTier,
        }));

        // Render (NO MobileLayout - already in student layout!)
        return (
            <div className="p-4 md:p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">All Courses</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {courses.length} available
                        </p>
                    </div>
                </div>

                {/* Error State */}
                {fetchError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-red-900 dark:text-red-100">Error</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    {fetchError}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Courses List */}
                {!fetchError && courses.length > 0 && (
                    <CoursesList items={coursesWithData} />
                )}

                {/* Empty State */}
                {!fetchError && courses.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <BookOpen className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Courses Available</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            No published courses yet
                        </p>
                    </div>
                )}
            </div>
        );

    } catch (error: any) {
        console.error("[COURSES_PAGE] Fatal error:", error);

        return (
            <div className="p-6">
                <div className="bg-red-50 rounded-xl p-6 text-center">
                    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 mb-2">Page Error</h2>
                    <p className="text-red-700">{error.message}</p>
                </div>
            </div>
        );
    }
}
