import { getTierInfo } from "@/lib/membership/check-course-access";
import { Badge } from "@/components/ui/badge";

interface MembershipBadgeProps {
    tier: string;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
}

export function MembershipBadge({ tier, size = "md", showIcon = true }: MembershipBadgeProps) {
    const tierInfo = getTierInfo(tier);

    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-3 py-1",
        lg: "text-base px-4 py-1.5",
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-gradient-to-r ${tierInfo.gradient} text-white ${sizeClasses[size]}`}
        >
            {showIcon && <span>{tierInfo.icon}</span>}
            <span>{tierInfo.name}</span>
        </div>
    );
}

interface TierBadgeProps {
    tier: string;
    variant?: "default" | "outline";
}

export function TierBadge({ tier, variant = "default" }: TierBadgeProps) {
    const tierInfo = getTierInfo(tier);

    if (variant === "outline") {
        return (
            <Badge variant="outline" className={`${tierInfo.color} border-current`}>
                {tierInfo.icon} {tierInfo.name}
            </Badge>
        );
    }

    return (
        <Badge className={`bg-gradient-to-r ${tierInfo.gradient} text-white border-0`}>
            {tierInfo.icon} {tierInfo.name}
        </Badge>
    );
}
