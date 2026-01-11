import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'super_admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { tierName, feature, value } = await req.json();

        // Update DB
        const { error } = await supabase
            .from("tier_pricing")
            .update({ [feature]: value })
            .eq("tier", tierName);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Tier Update Error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
