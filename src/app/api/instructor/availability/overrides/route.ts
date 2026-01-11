import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

        const body = await req.json();
        const { overrides } = body;

        // Full replace for simplicity or smart update
        // We delete existing overrides for this user? No, overrides are cumulative.
        // But for saving from UI that shows ALL overrides, we can delete and re-insert or upsert.
        // Let's do delete all and insert all strategy for now, assuming dataset is small per instructor.
        // CAUTION: This deletes past overrides too if not handled.
        // Best practice: Upsert based on ID. But if ID not present (new), insert. If removed, delete.
        // For MVP: Delete overrides for *future* dates and re-insert?
        // Let's stick to full replace to match UI state.

        await supabase.from("availability_overrides").delete().eq("instructor_id", user.id);

        if (overrides && overrides.length > 0) {
            const dataToInsert = overrides.map((o: any) => ({
                instructor_id: user.id,
                specific_date: o.specific_date,
                start_time: o.start_time,
                end_time: o.end_time,
                is_available: true
            }));

            const { error } = await supabase.from("availability_overrides").insert(dataToInsert);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
