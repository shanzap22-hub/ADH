import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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

        // Verify user owns this course
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("id, instructor_id, image_url")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        if (course.instructor_id !== user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Get all chapters to delete their videos
        const { data: chapters } = await supabase
            .from("chapters")
            .select("id, video_url")
            .eq("course_id", courseId);

        // Delete chapter videos from storage
        if (chapters && chapters.length > 0) {
            for (const chapter of chapters) {
                if (chapter.video_url) {
                    try {
                        // Extract file path from URL
                        const urlParts = chapter.video_url.split('/');
                        const fileName = urlParts[urlParts.length - 1];

                        await supabase.storage
                            .from("chapter-videos")
                            .remove([fileName]);
                    } catch (error) {
                        console.error("Error deleting chapter video:", error);
                    }
                }
            }
        }

        // Delete course thumbnail from storage
        if (course.image_url) {
            try {
                const urlParts = course.image_url.split('/');
                const fileName = urlParts[urlParts.length - 1];

                await supabase.storage
                    .from("course-thumbnails")
                    .remove([fileName]);
            } catch (error) {
                console.error("Error deleting course thumbnail:", error);
            }
        }

        // Delete the course (chapters will cascade delete due to foreign key)
        const { error: deleteError } = await supabase
            .from("courses")
            .delete()
            .eq("id", courseId);

        if (deleteError) {
            return new NextResponse("Failed to delete course", { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[COURSE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
