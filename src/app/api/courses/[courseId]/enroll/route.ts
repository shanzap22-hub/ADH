import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if already enrolled
        const { data: existingPurchase } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .maybeSingle();

        if (existingPurchase) {
            return new NextResponse("Already enrolled", { status: 400 });
        }

        // Check user's tier and course tier requirements
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier")
            .eq("id", user.id)
            .single();

        const userTier = profile?.membership_tier || "bronze";

        // Get course tier requirements
        const { data: tierAccess } = await supabase
            .from("course_tier_access")
            .select("tier")
            .eq("course_id", courseId);

        // If course has tier restrictions, validate user's access
        if (tierAccess && tierAccess.length > 0) {
            const allowedTiers = tierAccess.map(t => t.tier);

            // Get user's tier hierarchy
            const tierHierarchy = getTierHierarchy(userTier);

            // Check if user's tier allows access
            const hasAccess = allowedTiers.some(tier => tierHierarchy.includes(tier));

            if (!hasAccess) {
                const requiredTier = getMinimumRequiredTier(allowedTiers);
                return new NextResponse(
                    `This course requires ${requiredTier} membership or higher. Please upgrade your membership to enroll.`,
                    { status: 403 }
                );
            }
        }

        // Create free enrollment
        const { error: enrollError } = await supabase
            .from("purchases")
            .insert({
                user_id: user.id,
                course_id: courseId,
            });

        if (enrollError) {
            console.error("[FREE_ENROLL]", enrollError);
            return new NextResponse("Failed to enroll", { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FREE_ENROLL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// Helper functions
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

function getMinimumRequiredTier(allowedTiers: string[]): string {
    const tierOrder = ["bronze", "silver", "gold", "diamond"];
    for (const tier of tierOrder) {
        if (allowedTiers.includes(tier)) {
            return tier;
        }
    }
    return "bronze";
}
