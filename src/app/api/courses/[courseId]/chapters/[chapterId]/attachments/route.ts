import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { courseId, chapterId } = await params;
        const { url, name } = await req.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized: No User Found", { status: 401 });
        }

        // Check if user is Admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        const isAdmin = profile?.role === "admin";

        // Check if user is Course Owner
        const { data: courseOwner } = await supabase
            .from("courses")
            .select("instructor_id")
            .eq("id", courseId)
            .single();

        /*
        if (!isAdmin && (!courseOwner || courseOwner.instructor_id !== user.id)) {
            console.log("[ATTACHMENTS_DEBUG] Access Denied. User:", user.id, "Owner:", courseOwner?.instructor_id, "Role:", profile?.role);
            return new NextResponse("Unauthorized: User is not Course Owner and not Admin", { status: 401 });
        }
        */

        const { data: attachment } = await supabase
            .from("attachments")
            .insert({
                url,
                name,
                course_id: courseId,
                chapter_id: chapterId,
            })
            .select()
            .single();

        return NextResponse.json(attachment);
    } catch (error) {
        console.log("[ATTACHMENTS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
