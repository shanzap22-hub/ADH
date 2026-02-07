import { createClient } from "@/lib/supabase/server";
import { getCourseProgress } from "./get-course-progress";
import { cache } from "react";

export type DashboardCourse = {
    id: string;
    title: string;
    description?: string | null; // Optional now
    price: number | null;
    image_url: string | null;
    category: { name: string } | null;
    chaptersCount: number;
    chapters: {
        id: string;
    }[];
    progress: number | null;
};

export const getDashboardCourses = cache(async (userId: string): Promise<DashboardCourse[]> => {
    try {
        const supabase = await createClient();

        console.log("[GET_DASHBOARD_COURSES] Starting...");

        // 1. Get user's tier
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier")
            .eq("id", userId)
            .single();

        const userTier = profile?.membership_tier || "bronze";

        // 2. Get Direct Purchases
        const { data: purchases } = await supabase
            .from("purchases")
            .select("course_id")
            .eq("user_id", userId);

        const purchasedCourseIds = purchases?.map(p => p.course_id) || [];

        // 3. Get Tier-Accessible Courses (if applicable)
        // Fetch all tier access records for this tier
        const { data: tierAccess } = await supabase
            .from("course_tier_access")
            .select("course_id")
            .eq("tier", userTier);

        const tierCourseIds = tierAccess?.map(t => t.course_id) || [];

        // 4. Combine Unique IDs
        const allCourseIds = Array.from(new Set([...purchasedCourseIds, ...tierCourseIds]));

        if (allCourseIds.length === 0) {
            console.log("[GET_DASHBOARD_COURSES] No accessible courses found.");
            return [];
        }

        console.log(`[GET_DASHBOARD_COURSES] Found ${allCourseIds.length} unique courses (Purchased: ${purchasedCourseIds.length}, Tier: ${tierCourseIds.length})`);

        // 5. Fetch Course Details
        const { data: courses, error: coursesError } = await supabase
            .from("courses")
            .select(`
                id,
                title,
                description,
                price,
                image_url,
                chapters (
                    id,
                    is_published
                )
            `)
            .in("id", allCourseIds)
            .eq("is_published", true);

        if (coursesError) {
            console.error("[GET_DASHBOARD_COURSES] DB Error:", coursesError);
            return [];
        }

        // 6. Calculate Progress & Map
        const coursesWithProgress = await Promise.all(
            (courses || []).map(async (course: any) => {
                const progress = await getCourseProgress(userId, course.id);
                const publishedChapters = course.chapters?.filter((ch: any) => ch.is_published) || [];

                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    image_url: course.image_url,
                    category: null,
                    chaptersCount: publishedChapters.length,
                    chapters: publishedChapters,
                    progress,
                };
            })
        );

        return coursesWithProgress;

    } catch (error) {
        console.error("[GET_DASHBOARD_COURSES] CRITICAL ERROR:", error);
        return [];
    }
});
