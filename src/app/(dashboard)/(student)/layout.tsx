import { StudentDashboardLayoutContent } from "@/components/dashboard/StudentDashboardLayoutContent";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Fetch user role for role switcher
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let is_instructor = false;
    let is_super_admin = false;
    let permissions = {
        canViewCommunity: false,
        canViewLive: false,
        canViewChat: false
    };

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, phone_number, membership_tier")
            .eq("id", user.id)
            .single();

        if (profile) {
            is_instructor = profile.role === "instructor" || profile.role === "super_admin";
            is_super_admin = profile.role === "super_admin";

            // Enforce Profile Completion (Phone Number is mandatory)
            if (!profile.phone_number) {
                redirect("/onboarding/complete");
            }

            // Fetch Tier Permissions
            const { data: tierData } = await supabase
                .from("tier_pricing")
                .select("*")
                .eq("tier", (profile.membership_tier || "free").toLowerCase())
                .single();

            const isAdmin = is_instructor || is_super_admin || profile.role === "admin";

            if (isAdmin) {
                permissions = { canViewCommunity: true, canViewLive: true, canViewChat: true };
            } else if (tierData) {
                permissions = {
                    canViewCommunity: tierData.has_community_feed_access,
                    canViewLive: tierData.has_weekly_live_access || tierData.has_booking_access,
                    canViewChat: tierData.has_ai_access || tierData.has_community_chat_access
                };
            }
        }
    }

    return (
        <StudentDashboardLayoutContent
            is_instructor={is_instructor}
            is_super_admin={is_super_admin}
            permissions={permissions}
        >
            {children}
        </StudentDashboardLayoutContent>
    );
}
