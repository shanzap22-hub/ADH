import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get("instructorId");
    console.log("DEBUG_CAL_AVAIL: Request for Instructor:", instructorId);

    if (!instructorId) {
        return NextResponse.json({ error: "Missing instructorId" }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        // 1. Get Availability Patterns
        const { data: weeklySlots } = await supabase
            .from("availability_slots")
            .select("*")
            .eq("instructor_id", instructorId)
            .eq("is_active", true);

        console.log("DEBUG_CAL_AVAIL: Weekly Slots Found:", weeklySlots?.length);

        // 2. Get Overrides
        const { data: overrides } = await supabase
            .from("availability_overrides")
            .select("*")
            .eq("instructor_id", instructorId)
            .gte("specific_date", new Date().toISOString().split('T')[0]);

        // 3. Generate Dates
        const dates: string[] = [];
        const today = new Date();

        for (let i = 0; i < 60; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i);
            const dateStr = format(currentDate, 'yyyy-MM-dd');

            // A. Check Override first
            const override = overrides?.find(o => o.specific_date === dateStr);
            if (override) {
                if (override.is_available) {
                    dates.push(dateStr);
                }
                continue; // Override wins
            }

            // B. Check Weekly
            const dayOfWeek = currentDate.getDay(); // 0-6 (Sunday is 0)
            const hasWeeklySlot = weeklySlots?.some(s => s.day_of_week === dayOfWeek);

            if (hasWeeklySlot) {
                dates.push(dateStr);
            }
        }

        return NextResponse.json(dates);

    } catch (error) {
        console.error("Calendar availability error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
