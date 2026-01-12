import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch posts respecting RLS
        const { data: posts, error } = await supabase
            .from("posts")
            .select(`
                *,
                post_tier_access ( tier ),
                author:profiles ( full_name, avatar_url ) -- Assuming profiles has avatar_url, if not remove or ignore
            `)
            .order('is_pinned', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ posts });
    } catch (error: any) {
        console.error("Feed Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
