import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { id, content, link, isPinned, tiers, imageUrl } = body;

        if (!id || !content) {
            return NextResponse.json({ error: "Post ID and Content are required" }, { status: 400 });
        }

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Update Post
        const { error: updateError } = await supabase
            .from("posts")
            .update({
                content,
                link,
                image_url: imageUrl,
                is_pinned: isPinned || false
            })
            .eq('id', id)
            .eq('author_id', user.id); // Ensure ownership

        if (updateError) {
            throw updateError;
        }

        // Update Tiers (Delete all formatted and re-insert)
        // Note: This is a simple strategy.
        if (tiers) {
            // Delete existing
            await supabase.from("post_tier_access").delete().eq("post_id", id);

            // Insert new
            if (tiers.length > 0) {
                const tierData = tiers.map((tier: string) => ({
                    post_id: id,
                    tier
                }));
                await supabase.from("post_tier_access").insert(tierData);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
