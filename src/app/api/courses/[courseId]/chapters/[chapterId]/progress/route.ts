import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        const { courseId, chapterId } = await params;
        const body = await req.json();
        const { isCompleted } = body;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { error } = await supabase
            .from("user_progress")
            .upsert({
                user_id: user.id,
                chapter_id: chapterId,
                is_completed: isCompleted,
                updated_at: new Date().toISOString(), // Optional if default
            }, {
                onConflict: 'user_id, chapter_id'
            });

        if (error) {
            console.error("Progress Error", error);
            return new NextResponse("Internal Error", { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.log("[CHAPTER_ID_PROGRESS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
