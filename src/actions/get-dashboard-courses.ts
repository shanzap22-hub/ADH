import { createClient } from "@/lib/supabase/server";
import { getCourseProgress } from "./get-course-progress";

export type DashboardCourse = {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    image_url: string | null;
    category: { name: string } | null;
    chaptersCount: number;
    chapters: {
        id: string;
    }[];
    progress: number | null;
};

export const getDashboardCourses = async (userId: string): Promise<DashboardCourse[]> => {
    try {
        const supabase = await createClient();

        // Get user's tier first
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier")
            .eq("id", userId)
            .single();

        const userTier = profile?.membership_tier || "bronze";

        // Fetch purchased courses for this user
        const { data: purchases, error: purchasesError } = await supabase
            .from("purchases")
            .select("course_id")
            .eq("user_id", userId);

        if (purchasesError) {
            console.error("[GET_DASHBOARD_COURSES]", purchasesError);
            return [];
        }

        if (!purchases || purchases.length === 0) {
            return [];
        }

        const courseIds = purchases.map((p) => p.course_id);

        // Fetch course details with ALL required fields
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
            .in("id", courseIds)
            .eq("is_published", true);

        if (coursesError) {
            console.error("[GET_DASHBOARD_COURSES]", coursesError);
            return [];
        }

        if (!courses) {
            return [];
        }

        // Get tier access for all courses
        const { data: tierAccess } = await supabase
            .from("course_tier_access")
            .select("course_id, tier");

        // Create a map of course_id -> allowed tiers
        const courseAccessMap = new Map<string, string[]>();
        if (tierAccess) {
            tierAccess.forEach((access) => {
                if (!courseAccessMap.has(access.course_id)) {
                    courseAccessMap.set(access.course_id, []);
                }
                courseAccessMap.get(access.course_id)!.push(access.tier);
            });
        }

        // Calculate progress for each course AND filter by tier
        const coursesWithProgress = await Promise.all(
            courses.map(async (course: any) => {
                // Check if user's tier matches course tier
                const allowedTiers = courseAccessMap.get(course.id);

                // If no tier assignments OR user's tier doesn't match, return null
                if (!allowedTiers || !allowedTiers.includes(userTier)) {
                    console.log(`[GET_DASHBOARD_COURSES] Filtering out "${course.title}" - not assigned to tier "${userTier}"`);
                    return null;
                }

                const progress = await getCourseProgress(userId, course.id);
                const publishedChapters = course.chapters?.filter((ch: any) => ch.is_published) || [];

                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    image_url: course.image_url,
                    category: null, // Category removed - field doesn't exist
                    chaptersCount: publishedChapters.length,
                    chapters: publishedChapters,
                    progress,
                };
            })
        );

        // Filter out null values (courses not assigned to user's tier)
        return coursesWithProgress.filter((course): course is DashboardCourse => course !== null);
    } catch (error) {
        console.error("[GET_DASHBOARD_COURSES]", error);
        return [];
    }
};
