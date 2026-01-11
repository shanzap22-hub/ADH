import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

        const body = await req.json();
        const { slots } = body; // Expecting array of { day_of_week, start_time, end_time }

        // Determine if this is a full replace or incremental. 
        // For simplicity, let's do a full replace for the modified days or just all slots.
        // Full replace is safer for UI consistency.

        // 1. Delete all existing slots for this user
        await supabase.from("availability_slots").delete().eq("instructor_id", user.id);

        // 2. Insert new slots
        if (slots && slots.length > 0) {
            const slotsToInsert = slots.map((s: any) => ({
                instructor_id: user.id,
                day_of_week: s.day_of_week,
                start_time: s.start_time,
                end_time: s.end_time,
                is_active: true
            }));

            const { error } = await supabase.from("availability_slots").insert(slotsToInsert);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
