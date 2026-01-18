import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: overrides } = await supabase
            .from("availability_overrides")
            .select("*")
            .eq("instructor_id", user.id)
            .order("specific_date", { ascending: true });

        return NextResponse.json(overrides || []);
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await req.json();
        const { overrides } = body;

        // 1. Delete all existing overrides for this user (or handle selectively if frontend sends partial)
        // Frontend logic seems to send ALL overrides in the updated state.

        const { error: delError } = await adminSupabase.from("availability_overrides").delete().eq("instructor_id", user.id);
        if (delError) throw delError;

        if (overrides && overrides.length > 0) {
            const dataToInsert = overrides.map((o: any) => ({
                instructor_id: user.id,
                specific_date: o.specific_date,
                start_time: o.start_time,
                end_time: o.end_time,
                is_available: true
            }));

            const { error } = await adminSupabase.from("availability_overrides").insert(dataToInsert);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Overrides Update Error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
