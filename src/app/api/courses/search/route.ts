import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = 'edge';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ courses: [] });
        }

        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Search for courses by title or description
        console.log("[Search API] Searching for:", query);

        const { data: courses, error } = await supabase
            .from("courses")
            .select("id, title, description")
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .eq("is_published", true)
            .order("title")
            .limit(10);

        console.log("[Search API] Results:", courses?.length || 0, "courses found");

        if (error) {
            console.error("Course search error:", error);
            return NextResponse.json({ error: "Search failed", details: error.message }, { status: 500 });
        }

        return NextResponse.json({ courses: courses || [] });
    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
