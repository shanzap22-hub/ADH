import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check Auth using getUser() which is secure on server
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify Super Admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { features } = await req.json();

        // Update each tier feature
        for (const feature of features) {
            const { error } = await supabase
                .from("tier_pricing")
                .update({
                    has_chat_access: feature.has_chat_access,
                    has_weekly_live_access: feature.has_weekly_live_access
                })
                .eq('tier', feature.tier);

            if (error) {
                console.error("Error updating tier:", feature.tier, error);
                // Continue with next or fail? 
                // Usually better to fail or log.
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Internal Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
