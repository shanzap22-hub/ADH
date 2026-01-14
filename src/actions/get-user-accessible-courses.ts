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
        const tierHierarchy = getTierHierarchy(userTier);
        console.log("[getUserAccessibleCourses] Tier hierarchy:", tierHierarchy);

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

        // Filter and mark courses
        const accessibleCourses = await Promise.all(
            courses.map(async (course) => {
                const allowedTiers = courseAccessMap.get(course.id);

                // If no tier restrictions, HIDE the course
                if (!allowedTiers || allowedTiers.length === 0) {
                    return null;
                }

                // Check access
                const hasAccess = allowedTiers.includes(userTier);

                if (hasAccess) {
                    // Fetch progress
                    const { getCourseProgress } = await import("@/actions/get-course-progress");
                    const progress = await getCourseProgress(userId, course.id);

                    return {
                        ...transformCourse(course),
                        progress,
                        isLocked: false,
                    };
                }

                return null;
            })
        );

        const filteredCourses = accessibleCourses.filter((c): c is Course => c !== null);

        console.log("[getUserAccessibleCourses] Final accessible courses:", filteredCourses.length);
        return filteredCourses;
    } catch (error) {
        console.error("[getUserAccessibleCourses] Exception:", error);
        return [];
    }
}

/**
 * Get exact tier match (NO HIERARCHY)
 * Users only see courses assigned to their specific tier
 */
function getTierHierarchy(tier: string): string[] {
    // Return only the user's exact tier - NO hierarchy
    return [tier];
}

/**
 * Get the minimum required tier from a list of allowed tiers
 */
function getMinimumRequiredTier(allowedTiers: string[]): string {
    const tierOrder = ["bronze", "silver", "gold", "diamond"];

    for (const tier of tierOrder) {
        if (allowedTiers.includes(tier)) {
            return tier;
        }
    }

    return "bronze";
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
