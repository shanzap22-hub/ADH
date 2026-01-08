import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is super admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { assignments } = body;

        // Delete all existing tier assignments
        const { error: deleteError } = await supabase
            .from("course_tier_access")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

        if (deleteError) {
            console.error("[course-tiers] Delete error:", deleteError);
            return new NextResponse("Failed to clear existing assignments", { status: 500 });
        }

        // Insert new assignments
        const insertData: { course_id: string; tier: string }[] = [];
        assignments.forEach((assignment: { courseId: string; tiers: string[] }) => {
            assignment.tiers.forEach((tier) => {
                insertData.push({
                    course_id: assignment.courseId,
                    tier,
                });
            });
        });

        if (insertData.length > 0) {
            const { error: insertError } = await supabase
                .from("course_tier_access")
                .insert(insertData);

            if (insertError) {
                console.error("[course-tiers] Insert error:", insertError);
                return new NextResponse("Failed to save tier assignments", { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[course-tiers] Exception:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
