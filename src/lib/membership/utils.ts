/**
 * Get tier hierarchy for a given tier
 * Higher tiers include access to lower tiers
 */
export function getTierHierarchy(tier: string): string[] {
    switch (tier) {
        case "platinum":
            return ["platinum"];
        case "diamond":
            return ["diamond"];
        case "gold":
            return ["gold"];
        case "silver":
            return ["silver"];
        case "expired":
            return ["expired"];
        case "cancelled":
            return [];
        case "bronze":
            return ["bronze"];
        default:
            return [];
    }
}

/**
 * Get the minimum required tier from a list of allowed tiers
 */
export function getMinimumRequiredTier(allowedTiers: string[], tierOrder?: string[]): string {
    const order = tierOrder || ["free", "bronze", "silver", "gold", "diamond", "platinum", "expired"];

    for (const tier of order) {
        if (allowedTiers.includes(tier)) {
            return tier;
        }
    }

    return allowedTiers[0] || "free";
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
    const lowerTier = (tier || "").toLowerCase();
    switch (lowerTier) {
        case "platinum":
            return {
                name: "Platinum",
                color: "text-slate-900",
                icon: "💍",
                gradient: "from-slate-700 to-slate-900",
            };
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
        case "expired":
            return {
                name: "Expired",
                color: "text-red-600",
                icon: "⚠️",
                gradient: "from-red-500 to-red-700",
            };
        case "cancelled":
            return {
                name: "Cancelled",
                color: "text-red-900",
                icon: "🚫",
                gradient: "from-red-800 to-red-950",
            };
        case "free":
            return {
                name: "Free",
                color: "text-gray-500",
                icon: "🆓",
                gradient: "from-gray-400 to-gray-500",
            };
        case "bronze":
            return {
                name: "Bronze",
                color: "text-orange-700",
                icon: "🥉",
                gradient: "from-orange-600 to-amber-700",
            };
        default:
            // Dynamic fallback: Capitalize tier and provide general styling
            const displayName = tier ? (tier.charAt(0).toUpperCase() + tier.slice(1)) : "Member";
            return {
                name: displayName,
                color: "text-purple-600",
                icon: "✨",
                gradient: "from-purple-500 to-indigo-600",
            };
    }
}

/**
 * Get tier comparison for upgrade prompts
 */
export function compareTiers(currentTier: string, requiredTier: string, tierOrder?: string[]): {
    needsUpgrade: boolean;
    tierDifference: number;
} {
    const order = tierOrder || ["cancelled", "expired", "free", "bronze", "silver", "gold", "diamond", "platinum"];
    const currentIndex = order.indexOf(currentTier);
    const requiredIndex = order.indexOf(requiredTier);

    return {
        needsUpgrade: requiredIndex > currentIndex,
        tierDifference: requiredIndex - currentIndex,
    };
}
