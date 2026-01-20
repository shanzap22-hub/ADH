import { createClient } from "@/lib/supabase/server";
import { getTierHierarchy, getMinimumRequiredTier } from "./utils";

/**
 * Check if a user can access a specific course based on their membership tier
 */
export async function canAccessCourse(
    userId: string,
    courseId: string
): Promise<{ canAccess: boolean; reason?: string; requiredTier?: string }> {
    try {
        const supabase = await createClient();

        // Get user's tier
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("membership_tier, role")
            .eq("id", userId)
            .single();

        if (profileError || !profile) {
            return { canAccess: false, reason: "User profile not found" };
        }

        // Super admins and instructors have full access
        if (profile.role === "super_admin" || profile.role === "instructor") {
            return { canAccess: true };
        }

        const userTier = profile.membership_tier || "bronze";

        // Get course tier requirements
        const { data: tierAccess, error: tierError } = await supabase
            .from("course_tier_access")
            .select("tier")
            .eq("course_id", courseId);

        if (tierError) {
            console.error("[canAccessCourse] Error fetching tier access:", tierError);
            return { canAccess: false, reason: "Error checking course access" };
        }

        // If no tier restrictions, course is accessible to all
        if (!tierAccess || tierAccess.length === 0) {
            return { canAccess: true };
        }

        // Check if user's tier is in the allowed tiers
        const allowedTiers = tierAccess.map((t) => t.tier);
        const tierHierarchy = getTierHierarchy(userTier);

        const hasAccess = allowedTiers.some((tier) => tierHierarchy.includes(tier));

        if (!hasAccess) {
            // Find the minimum required tier
            const requiredTier = getMinimumRequiredTier(allowedTiers);
            return {
                canAccess: false,
                reason: `This course requires ${requiredTier} membership or higher`,
                requiredTier,
            };
        }

        return { canAccess: true };
    } catch (error) {
        console.error("[canAccessCourse] Exception:", error);
        return { canAccess: false, reason: "Error checking course access" };
    }
}

// definitions removed. They are imported.
