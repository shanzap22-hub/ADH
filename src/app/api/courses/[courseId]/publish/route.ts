import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const supabase = await createClient();
        const body = await req.json();
        const { isPublished } = body;

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify user owns this course
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("id, instructor_id")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        if (course.instructor_id !== user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Update publish status
        const { error: updateError } = await supabase
            .from("courses")
            .update({ is_published: isPublished })
            .eq("id", courseId);

        if (updateError) {
            return new NextResponse("Failed to update course", { status: 500 });
        }

        return NextResponse.json({ success: true, isPublished });
    } catch (error) {
        console.error("[COURSE_PUBLISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
