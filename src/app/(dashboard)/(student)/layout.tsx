import { StudentDashboardLayoutContent } from "@/components/dashboard/StudentDashboardLayoutContent";
import { createClient } from "@/lib/supabase/server";

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

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile) {
            is_instructor = profile.role === "instructor" || profile.role === "super_admin";
            is_super_admin = profile.role === "super_admin";
        }
    }

    return (
        <StudentDashboardLayoutContent is_instructor={is_instructor} is_super_admin={is_super_admin}>
            {children}
        </StudentDashboardLayoutContent>
    );
}
