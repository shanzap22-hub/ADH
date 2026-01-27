import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";
import { MobileLayout } from "@/components/dashboard/MobileLayout";
import { Search as SearchIcon, BookOpen } from "lucide-react";

export default async function SearchPage() {
    // CRITICAL: Auth check first
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
        return redirect("/");
    }

    let courses: any[] = [];
    let fetchError = null;
    let userTier = 'free';

    try {
        // Step 1: Get user's membership tier
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier")
            .eq("id", user.id)
            .single();

        userTier = profile?.membership_tier || 'free';

        // Step 2: Get tier hierarchy (which tiers this user can access)
        const { data: tierHierarchy } = await supabase
            .rpc('get_user_tier_hierarchy', { user_tier: userTier });

        const accessibleTiers = tierHierarchy || [userTier];

        // Step 3: Get courses accessible by tier OR already enrolled
        const { data, error } = await supabase
            .from("courses")
            .select(`
                *,
                chapters (
                    id
                ),
                course_tier_access!inner (
                    tier
                )
            `)
            .eq("is_published", true)
            .in("course_tier_access.tier", accessibleTiers)
            .order("created_at", { ascending: false });

        // Step 4: Get enrolled courses (purchased courses should always be visible)
        const { data: enrolledCourses } = await supabase
            .from("purchases")
            .select(`
                course_id,
                courses (
                    *,
                    chapters (
                        id
                    )
                )
            `)
            .eq("user_id", user.id);

        if (error) {
            console.error("[SEARCH_PAGE] Database error:", error);
            fetchError = error.message;
        } else {
            // Combine tier-accessible courses and enrolled courses
            const tierCourses = data || [];
            const enrolledCoursesList = enrolledCourses?.map(e => e.courses).filter(Boolean) || [];

            // Merge and deduplicate by course ID
            const courseMap = new Map();

            tierCourses.forEach(course => {
                courseMap.set(course.id, course);
            });

            enrolledCoursesList.forEach(course => {
                if (course && !courseMap.has(course.id)) {
                    courseMap.set(course.id, course);
                }
            });

            courses = Array.from(courseMap.values());
        }
    } catch (error: any) {
        console.error("[SEARCH_PAGE] Fetch exception:", error);
        fetchError = "Failed to load courses";
    }

    // Transform data
    const coursesWithMockData = courses.map((course: any) => ({
        ...course,
        category: null,
        chapters: course.chapters || [],
        progress: null,
    }));

    return (
        <MobileLayout>
            <div className="p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center">
                        <SearchIcon className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">Explore Courses</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {courses.length} courses available for {userTier} tier
                        </p>
                    </div>
                </div>

                {/* Error State */}
                {fetchError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                                <span className="text-red-600 dark:text-red-400 text-lg">!</span>
                            </div>
                            <div>
                                <p className="font-semibold text-red-900 dark:text-red-100">
                                    Failed to Load Courses
                                </p>
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    {fetchError}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Courses List */}
                {!fetchError && <CoursesList items={coursesWithMockData} />}

                {/* Empty State */}
                {!fetchError && courses.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-4">
                            <BookOpen className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Upgrade your membership to access more courses!
                        </p>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
