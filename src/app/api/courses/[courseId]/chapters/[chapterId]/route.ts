import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { courseId, chapterId } = await params;
        const supabase = await createClient();

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

        // Get chapter details
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select("id, video_url, position")
            .eq("id", chapterId)
            .eq("course_id", courseId)
            .single();

        if (chapterError || !chapter) {
            return new NextResponse("Chapter not found", { status: 404 });
        }

        // Delete video from storage if exists
        if (chapter.video_url) {
            try {
                const urlParts = chapter.video_url.split('/');
                const fileName = urlParts[urlParts.length - 1];

                await supabase.storage
                    .from("chapter-videos")
                    .remove([fileName]);
            } catch (error) {
                console.error("Error deleting chapter video:", error);
            }
        }

        // Delete chapter
        const { error: deleteError } = await supabase
            .from("chapters")
            .delete()
            .eq("id", chapterId);

        if (deleteError) {
            return new NextResponse("Failed to delete chapter", { status: 500 });
        }

        // Reorder remaining chapters
        const { data: remainingChapters } = await supabase
            .from("chapters")
            .select("id, position")
            .eq("course_id", courseId)
            .gt("position", chapter.position)
            .order("position", { ascending: true });

        if (remainingChapters && remainingChapters.length > 0) {
            for (const ch of remainingChapters) {
                await supabase
                    .from("chapters")
                    .update({ position: ch.position - 1 })
                    .eq("id", ch.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CHAPTER_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
