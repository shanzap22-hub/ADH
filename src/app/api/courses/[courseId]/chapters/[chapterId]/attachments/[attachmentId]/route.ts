import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string; attachmentId: string }> }
) {
    try {
        const { courseId, chapterId, attachmentId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { data: courseOwner } = await supabase
            .from("courses")
            .select("instructor_id")
            .eq("id", courseId)
            .single();

        if (!courseOwner || courseOwner.instructor_id !== user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        await supabase
            .from("attachments")
            .delete()
            .eq("id", attachmentId);

        return new NextResponse("Success", { status: 200 });
    } catch (error) {
        console.log("[ATTACHMENT_ID]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
