import { StudentSidebar } from "@/components/dashboard/StudentSidebar";
import { StudentMobileSidebar } from "@/components/dashboard/StudentMobileSidebar";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { TopHeader } from "@/components/dashboard/TopHeader";
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
        <div className="h-full">
            {/* Top Navigation Header */}
            <TopHeader />

            <div className="h-[80px] md:pl-56 fixed inset-y-0 w-full z-40 mt-16">
                <div className="p-4 border-b h-full flex items-center bg-background shadow-sm">
                    <StudentMobileSidebar />
                    <div className="flex w-full justify-end">
                        {/* UserButton / Actions */}
                    </div>
                </div>
            </div>
            <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-40 mt-16">
                <StudentSidebar is_instructor={is_instructor} is_super_admin={is_super_admin} />
            </div>
            <main className="md:pl-56 pt-[144px] pb-16 md:pb-0 h-full">
                {children}
            </main>
            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />
        </div>
    );
}
