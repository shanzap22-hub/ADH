import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data } = await supabase
            .from("instructor_booking_settings")
            .select("*")
            .eq("instructor_id", user.id)
            .single();

        return NextResponse.json(data || { slot_duration: 30, buffer_time: 5, min_notice_time: 60 });
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

        const { error } = await supabase
            .from("instructor_booking_settings")
            .upsert({
                instructor_id: user.id,
                slot_duration: body.slot_duration || 30,
                buffer_time: body.buffer_time || 5,
                min_notice_time: body.min_notice_time || 60,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
