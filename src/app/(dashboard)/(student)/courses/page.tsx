import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";
import { BookOpen, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

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
        // Fetch courses with tier-based access
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
    // Render (NO MobileLayout - already in student layout!)
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">



            {/* Error State */}
            {fetchError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-red-900">Unable to load courses</p>
                            <p className="text-sm text-red-700 mt-1">
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
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                        <BookOpen className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Courses Available</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        We are currently updating our course catalog. Please check back later for new content.
                    </p>
                </div>
            )}
        </div>
    );
}
