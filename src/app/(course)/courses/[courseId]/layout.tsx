import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseSidebar } from "./_components/course-sidebar";
// import { TopHeader } from "@/components/dashboard/TopHeader";
import { BottomNav } from "@/components/dashboard/BottomNav";

export default async function CourseLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    //   if (!user) {
    //     return redirect("/");
    //   }

    const { data: course } = await supabase
        .from("courses")
        .select(`
        *,
        chapters (
            id,
            title,
            description,
            video_url,
            is_published,
            is_free,
            position
        )
    `)
        .eq("id", courseId)
        .single();

    if (!course) {
        return redirect("/");
    }

    // Sort chapters
    course.chapters.sort((a: any, b: any) => a.position - b.position);

    // Mock progress count
    const progressCount = 0;

    // Fetch Tier Permissions for BottomNav
    let permissions = {
        canViewCommunity: false,
        canViewLive: false,
        canViewChat: false,
        hideOnPlayer: true // Enable auto-hide feature
    };

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, membership_tier")
            .eq("id", user.id)
            .single();

        if (profile) {
            const is_instructor = profile.role === "instructor" || profile.role === "super_admin";
            const is_super_admin = profile.role === "super_admin";
            const isAdmin = is_instructor || is_super_admin || profile.role === "admin";

            // Fetch Tier Permissions
            const { data: tierData } = await supabase
                .from("tier_pricing")
                .select("*")
                .eq("tier", (profile.membership_tier || "free").toLowerCase())
                .single();

            if (isAdmin) {
                permissions = { ...permissions, canViewCommunity: true, canViewLive: true, canViewChat: true };
            } else if (tierData) {
                permissions = {
                    ...permissions,
                    canViewCommunity: tierData.has_community_feed_access,
                    canViewLive: tierData.has_weekly_live_access || tierData.has_booking_access,
                    canViewChat: tierData.has_ai_access || tierData.has_community_chat_access
                };
            }
        }
    }

    return (
        <div className="h-full">
            {/* Removed TopHeader as requested */}
            {/* <div className="h-[80px] fixed inset-y-0 w-full z-50">
                <TopHeader />
            </div> */}

            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-40">
                <CourseSidebar
                    course={course}
                    progressCount={progressCount}
                />
            </div>
            {/* Adjusted padding: removed pt-[80px] since header is gone */}
            <main className="md:pl-80 h-full pb-20 md:pb-0">
                {children}
            </main>

            {/* Added BottomNav for mobile navigation */}
            <BottomNav permissions={permissions} />
        </div>
    )
}
