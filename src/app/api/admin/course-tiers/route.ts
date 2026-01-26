import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        // 1. Authenticate User
        const supabaseAuth = await createClient();
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

        if (!user || authError) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Use Service Role Client for DB operations
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

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

        // Delete all existing tier assignments - be careful with this!
        // Instead of deleting everything, it's safer to upsert or delete by course if possible.
        // But for this UI, full replace is acceptable if enclosed in transaction logic or service role.

        // Using 'course_id' not null as a condition to delete all rows
        const { error: deleteError } = await supabase
            .from("course_tier_access")
            .delete()
            .neq("course_id", "00000000-0000-0000-0000-000000000000"); // Hack to delete all rows

        if (deleteError) {
            console.error("[course-tiers] Delete error:", deleteError);
            // If delete fails, it might be RLS or foreign key constraint
            return new NextResponse(`Failed to clear existing assignments: ${deleteError.message}`, { status: 500 });
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
                return new NextResponse(`Failed to save tier assignments: ${insertError.message}`, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[course-tiers] Exception:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
