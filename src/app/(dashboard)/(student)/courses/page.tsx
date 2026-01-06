import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";
import { MobileLayout } from "@/components/dashboard/MobileLayout";
import { BookOpen, AlertCircle } from "lucide-react";

export default async function CoursesPage() {
    try {
        // Step 1: Auth check
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        console.log("[COURSES_PAGE] Auth check:", {
            hasUser: !!user,
            authError: authError?.message
        });

        if (!user || authError) {
            console.log("[COURSES_PAGE] No user, redirecting");
            return redirect("/");
        }

        let courses: any[] = [];
        let fetchError: string | null = null;

        // Step 2: Fetch courses with extensive logging
        try {
            console.log("[COURSES_PAGE] Fetching courses...");

            const { data, error } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    description,
                    image_url,
                    price,
                    chapters (
                        id
                    )
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false });

            console.log("[COURSES_PAGE] Query result:", {
                dataLength: data?.length,
                error: error?.message,
                errorCode: error?.code
            });

            if (error) {
                console.error("[COURSES_PAGE] Supabase error:", error);
                fetchError = `Database error: ${error.message}`;
                courses = [];
            } else {
                courses = data || [];
                console.log("[COURSES_PAGE] Successfully fetched:", courses.length, "courses");
            }
        } catch (error: any) {
            console.error("[COURSES_PAGE] Fetch exception:", error);
            fetchError = `Failed to load: ${error.message}`;
            courses = [];
        }

        // Step 3: Transform data safely
        const coursesWithData = courses.map((course: any) => ({
            id: course.id,
            title: course.title || "Untitled",
            description: course.description,
            image_url: course.image_url,
            price: course.price,
            category: null,
            chapters: Array.isArray(course.chapters) ? course.chapters : [],
            progress: null,
        }));

        console.log("[COURSES_PAGE] Rendering with:", {
            coursesCount: coursesWithData.length,
            hasFetchError: !!fetchError
        });

        // Step 4: Render
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
                                {courses.length} available
                            </p>
                        </div>
                    </div>

                    {/* Error State */}
                    {fetchError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-bold text-red-900 dark:text-red-100 text-lg">
                                        Error Loading Courses
                                    </p>
                                    <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                                        {fetchError}
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                                        Please check browser console for details
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
                        <div className="text-center py-16 px-4">
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-4">
                                <BookOpen className="h-10 w-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No Courses Available</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                No published courses found in database
                            </p>
                        </div>
                    )}
                </div>
            </MobileLayout>
        );

    } catch (error: any) {
        // Catch-all error boundary
        console.error("[COURSES_PAGE] Page-level error:", error);

        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-900 mb-2">
                            Page Error
                        </h2>
                        <p className="text-red-700 mb-4">
                            {error.message || "Something went wrong"}
                        </p>
                        <p className="text-sm text-red-600">
                            Check browser console for details
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
