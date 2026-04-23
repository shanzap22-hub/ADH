import { createClient } from "@/lib/supabase/server";

export interface Course {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number | null;
    category: string | null;
    chapters: any[];
    progress: number | null;
    isLocked?: boolean;
    requiredTier?: string;
}

/**
 * Get courses accessible to a user based on their membership tier
 */
export async function getUserAccessibleCourses(userId: string): Promise<Course[]> {
    try {
        const supabase = await createClient();

        console.log("[getUserAccessibleCourses] Starting for user:", userId);

        // Get user's tier and role
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("membership_tier, role")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            console.error("[getUserAccessibleCourses] Profile error:", profileError);
            return [];
        }

        const userTier = profile.membership_tier || "bronze";
        const userRole = profile.role;

        console.log("[getUserAccessibleCourses] User profile:", { userTier, userRole });

        // Super admins and instructors see all courses
        if (userRole === "super_admin" || userRole === "instructor") {
            console.log("[getUserAccessibleCourses] User is admin/instructor - fetching all courses");
            const { data: allCourses, error } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    description,
                    image_url,
                    price,
                    chapters (id)
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("[getUserAccessibleCourses] Error:", error);
                return [];
            }

            console.log("[getUserAccessibleCourses] Admin courses count:", allCourses?.length || 0);
            return transformCourses(allCourses || []);
        }

        // Get tier hierarchy (e.g., silver user can access bronze + silver)
        console.log("[getUserAccessibleCourses] User Tier:", userTier);

        // Get all published courses
        const { data: courses, error: coursesError } = await supabase
            .from("courses")
            .select(`
                id,
                title,
                description,
                image_url,
                price,
                chapters (id)
            `)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (coursesError) {
            console.error("[getUserAccessibleCourses] Courses error:", coursesError);
            return [];
        }

        console.log("[getUserAccessibleCourses] Total published courses:", courses?.length || 0);

        if (!courses || courses.length === 0) {
            console.log("[getUserAccessibleCourses] No published courses found");
            return [];
        }

        // Get tier access for all courses
        const { data: tierAccess, error: tierError } = await supabase
            .from("course_tier_access")
            .select("course_id, tier");

        if (tierError) {
            console.error("[getUserAccessibleCourses] Tier access error:", tierError);
        }

        console.log("[getUserAccessibleCourses] Tier access records:", tierAccess?.length || 0);

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

        console.log("[getUserAccessibleCourses] Course access map:", Object.fromEntries(courseAccessMap));

        // Filter based on tier access
        const tierFilteredCourses = courses.filter((course) => {
            const allowedTiers = courseAccessMap.get(course.id);
            // If no tier restrictions, HIDE the course
            if (!allowedTiers || allowedTiers.length === 0) return false;
            // Check access
            return allowedTiers.includes(userTier);
        });

        if (tierFilteredCourses.length === 0) return [];

        // Fetch progress in batch for all tier-filtered courses
        const { getBatchCourseProgress } = await import("@/actions/get-batch-course-progress");
        const progressMap = await getBatchCourseProgress(userId, tierFilteredCourses.map(c => c.id));

        const finalCourses = tierFilteredCourses.map(course => ({
            ...transformCourse(course),
            progress: progressMap[course.id] || 0,
            isLocked: false,
        }));

        console.log("[getUserAccessibleCourses] Final accessible courses:", finalCourses.length);
        return finalCourses;
    } catch (error) {
        console.error("[getUserAccessibleCourses] Exception:", error);
        return [];
    }
}

/**
 * Get exact tier match (NO HIERARCHY)
 * Users only see courses assigned to their specific tier
 */
function getTierHierarchy(_tier: string): string[] {
    // Return only the user's exact tier - NO hierarchy
    return [_tier];
}


/**
 * Transform a single course
 */
function transformCourse(course: any): Course {
    return {
        id: course.id,
        title: course.title || "Untitled",
        description: course.description,
        image_url: course.image_url,
        price: course.price,
        category: null, // Category system not yet implemented
        chapters: Array.isArray(course.chapters) ? course.chapters : [],
        progress: null,
    };
}

/**
 * Transform multiple courses
 */
function transformCourses(courses: any[]): Course[] {
    return courses.map(transformCourse);
}
