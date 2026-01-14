import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const postId = searchParams.get('id');

        if (!postId) {
            return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
        }

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // The RLS policy "Instructors can delete own posts" should handle the permission check
        // But we should also verify if the response returned any deleted row
        const { error, count } = await supabase
            .from("posts")
            .delete({ count: 'exact' })
            .eq('id', postId)
            .eq('author_id', user.id); // Double check ownership explicitly for safety

        if (error) {
            console.error("Delete error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (count === 0) {
            return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
