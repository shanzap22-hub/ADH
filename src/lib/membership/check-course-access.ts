import { createClient } from "@/lib/supabase/server";

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

/**
 * Get tier hierarchy for a given tier
 * Higher tiers include access to lower tiers
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
 * Get tier display information
 */
export function getTierInfo(tier: string): {
    name: string;
    color: string;
    icon: string;
    gradient: string;
} {
    switch (tier) {
        case "diamond":
            return {
                name: "Diamond",
                color: "text-blue-600",
                icon: "💎",
                gradient: "from-blue-500 to-purple-600",
            };
        case "gold":
            return {
                name: "Gold",
                color: "text-yellow-600",
                icon: "🥇",
                gradient: "from-yellow-400 to-orange-500",
            };
        case "silver":
            return {
                name: "Silver",
                color: "text-gray-600",
                icon: "🥈",
                gradient: "from-gray-400 to-gray-600",
            };
        case "bronze":
        default:
            return {
                name: "Bronze",
                color: "text-orange-700",
                icon: "🥉",
                gradient: "from-orange-600 to-amber-700",
            };
    }
}

/**
 * Get tier comparison for upgrade prompts
 */
export function compareTiers(currentTier: string, requiredTier: string): {
    needsUpgrade: boolean;
    tierDifference: number;
} {
    const tierOrder = ["bronze", "silver", "gold", "diamond"];
    const currentIndex = tierOrder.indexOf(currentTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);

    return {
        needsUpgrade: requiredIndex > currentIndex,
        tierDifference: requiredIndex - currentIndex,
    };
}
