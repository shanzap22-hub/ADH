import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Admin check
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { content, link, isPinned, tiers } = body;

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        // Insert Post
        const { data: post, error: postError } = await supabase
            .from("posts")
            .insert({
                content,
                link,
                is_pinned: isPinned || false,
                author_id: user.id
            })
            .select()
            .single();

        if (postError) {
            console.error("Post creation error:", postError);
            throw postError;
        }

        // Insert Tiers
        if (tiers && tiers.length > 0) {
            const tierData = tiers.map((tier: string) => ({
                post_id: post.id,
                tier
            }));

            const { error: tierError } = await supabase
                .from("post_tier_access")
                .insert(tierData);

            if (tierError) {
                console.error("Tier assignment error:", tierError);
                // Optional: rollback post? Supabase doesn't support transactions in JS client easily without RPC.
                // For now, we assume it works or handle manually.
                throw tierError;
            }
        }

        return NextResponse.json({ success: true, post });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
