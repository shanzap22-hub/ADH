import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get("year");
    const monthStr = searchParams.get("month"); // 0-indexed or 1-indexed? Let's use 0-11 standard JS or 1-12. Let's say 1-12 for API clarity
    const instructorId = searchParams.get("instructorId");

    if (!yearStr || !monthStr || !instructorId) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const year = parseInt(yearStr);
        const month = parseInt(monthStr); // Expecting 1-12

        // 1. Fetch Weekly Slots
        const { data: weeklySlots } = await supabase
            .from("availability_slots")
            .select("day_of_week")
            .eq("instructor_id", instructorId)
            .eq("is_active", true);

        const availableDaysOfWeek = new Set(weeklySlots?.map(s => s.day_of_week) || []);

        // 2. Fetch Overrides for this month
        // Construct date range
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const { data: overrides } = await supabase
            .from("availability_overrides")
            .select("specific_date, is_available")
            .eq("instructor_id", instructorId)
            .gte("specific_date", startDateStr)
            .lte("specific_date", endDateStr);

        // 3. Calculate Available Dates
        const availableDates: string[] = [];
        const daysInMonth = endDate.getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const current = new Date(year, month - 1, d);

            // Fix: Use manual formatting to avoid UTC shift from toISOString()
            // e.g. Local 00:00 -> UTC Previous Day 18:30 -> Wrong DateStr
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            const dayOfWeek = current.getDay(); // 0-6

            // Ensure not in past
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (current < today) continue;

            // Check override first
            const override = overrides?.find(o => o.specific_date === dateStr);

            if (override) {
                if (override.is_available) {
                    availableDates.push(dateStr);
                }
            } else {
                // Check weekly
                if (availableDaysOfWeek.has(dayOfWeek)) {
                    availableDates.push(dateStr);
                }
            }
        }

        return NextResponse.json(availableDates);
    } catch (error) {
        console.error("Availability fetch error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
