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

        // Super admins and instructors see all courses
        if (userRole === "super_admin" || userRole === "instructor") {
            const { data: allCourses, error } = await supabase
                .from("courses")
                .select(`
                    id,
                    title,
                    description,
                    image_url,
                    price,
                    category_id,
                    chapters (id)
                `)
                .eq("is_published", true)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("[getUserAccessibleCourses] Error:", error);
                return [];
            }

            return transformCourses(allCourses || []);
        }

        // Get tier hierarchy (e.g., silver user can access bronze + silver)
        const tierHierarchy = getTierHierarchy(userTier);

        // Get all published courses
        const { data: courses, error: coursesError } = await supabase
            .from("courses")
            .select(`
                id,
                title,
                description,
                image_url,
                price,
                category_id,
                chapters (id)
            `)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (coursesError) {
            console.error("[getUserAccessibleCourses] Courses error:", coursesError);
            return [];
        }

        if (!courses || courses.length === 0) {
            return [];
        }

        // Get tier access for all courses
        const { data: tierAccess, error: tierError } = await supabase
            .from("course_tier_access")
            .select("course_id, tier");

        if (tierError) {
            console.error("[getUserAccessibleCourses] Tier access error:", tierError);
        }

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

        // Filter and mark courses
        const accessibleCourses: Course[] = [];

        for (const course of courses) {
            const allowedTiers = courseAccessMap.get(course.id);

            // If no tier restrictions, course is accessible to all
            if (!allowedTiers || allowedTiers.length === 0) {
                accessibleCourses.push({
                    ...transformCourse(course),
                    isLocked: false,
                });
                continue;
            }

            // Check if user's tier hierarchy includes any of the allowed tiers
            const hasAccess = allowedTiers.some((tier) => tierHierarchy.includes(tier));

            if (hasAccess) {
                accessibleCourses.push({
                    ...transformCourse(course),
                    isLocked: false,
                });
            } else {
                // Include locked courses so user can see upgrade prompts
                const requiredTier = getMinimumRequiredTier(allowedTiers);
                accessibleCourses.push({
                    ...transformCourse(course),
                    isLocked: true,
                    requiredTier,
                });
            }
        }

        return accessibleCourses;
    } catch (error) {
        console.error("[getUserAccessibleCourses] Exception:", error);
        return [];
    }
}

/**
 * Get tier hierarchy for a given tier
 */
function getTierHierarchy(tier: string): string[] {
    switch (tier) {
        case "diamond":
            return ["bronze", "silver", "gold", "diamond"];
        case "gold":
            return ["bronze", "silver", "gold"];
        case "silver":
            return ["bronze", "silver"];
        case "bronze":
        default:
            return ["bronze"];
    }
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
        category: course.category_id,
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
