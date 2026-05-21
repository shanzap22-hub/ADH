import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";
import { BookOpen, AlertCircle } from "lucide-react";
import { GoBackButton } from "@/components/ui/go-back-button";

// 2026 Performance: ISR with shorter revalidation for course listings
// Balances freshness with performance (revalidate every 10 minutes)
export const revalidate = 600;

export default async function CoursesPage() {
    // Auth check - MUST be outside try-catch to allow redirects
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("[COURSES_PAGE] Auth check:", { hasUser: !!user });

    if (!user || authError) {
        return redirect("/");
    }

    let courses: any[] = [];
    let fetchError: string | null = null;

    try {
        // Fetch programs with tier-based access
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

    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            {/* Page Header */}
            <div className="px-4 md:px-8 pt-3 md:pt-4 pb-4">
                <GoBackButton />
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-2">
                    My Programs
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">
                    {courses.length > 0 ? `${courses.length} program${courses.length === 1 ? '' : 's'} available` : 'Explore your learning journey'}
                </p>
            </div>

            <div className="px-4 md:px-8 space-y-4">
                {/* Error State */}
                {fetchError && (
                    <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-5">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-rose-900 dark:text-rose-200 text-sm">Unable to load Programs</p>
                                <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">{fetchError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* programs List */}
                {!fetchError && courses.length > 0 && (
                    <CoursesList items={coursesWithData} />
                )}

                {/* Empty State */}
                {!fetchError && courses.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-violet-200 dark:border-violet-800/50">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center mb-4">
                            <BookOpen className="h-8 w-8 text-violet-300 dark:text-violet-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No Programs Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                            We are updating our Program catalog. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
