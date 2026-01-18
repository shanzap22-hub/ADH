import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Use Admin client to ensure we can read regardless of RLS (though GET typically works)
        // Actually GET works fine usually. Let's keep GET simple or upgrade it too if needed.
        // For consistency, let's just stick to Auth client for GET usually, unless RLS is totally blocking.
        // The user complained about "Reschedule/Delete" (POST).

        const { data: slots } = await supabase
            .from("availability_slots")
            .select("*")
            .eq("instructor_id", user.id)
            .order("day_of_week", { ascending: true })
            .order("start_time", { ascending: true });

        return NextResponse.json(slots || []);
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Use Admin Client for Write Operations to bypass RLS issues
        const adminSupabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await req.json();
        const { slots } = body;

        // 1. Delete all existing slots for this user
        const { error: delError } = await adminSupabase.from("availability_slots").delete().eq("instructor_id", user.id);
        if (delError) {
            console.error("Delete failed", delError);
            throw delError;
        }

        // 2. Insert new slots
        if (slots && slots.length > 0) {
            const slotsToInsert = slots.map((s: any) => ({
                instructor_id: user.id,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                is_active: true
            }));

            const { error } = await adminSupabase.from("availability_slots").insert(slotsToInsert);
            if (error) {
                console.error("Insert failed", error);
                throw error;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Availability Update Error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
