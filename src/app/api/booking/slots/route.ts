import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const instructorId = searchParams.get("instructorId");

    if (!dateStr || !instructorId) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0-6

        // 0. Get Instructor Settings (Duration & Buffer)
        const { data: settings } = await supabase
            .from("instructor_booking_settings")
            .select("slot_duration, buffer_time")
            .eq("instructor_id", instructorId)
            .single();

        const durationMinutes = settings?.slot_duration || 30;
        const bufferMinutes = settings?.buffer_time || 5;

        // 1. Get Availability (Check Overrides FIRST, then Weekly)
        // Check for Specific Date Override
        const { data: overrides } = await supabase
            .from("availability_overrides")
            .select("*")
            .eq("instructor_id", instructorId)
            .eq("specific_date", dateStr); // Exact date match

        let activeSlots: any[] = [];

        if (overrides && overrides.length > 0) {
            // Use overrides if present
            activeSlots = overrides.filter(o => o.is_available);
        } else {
            // Fallback to Weekly Slots
            const { data: weeklySlots } = await supabase
                .from("availability_slots")
                .select("*")
                .eq("instructor_id", instructorId)
                .eq("day_of_week", dayOfWeek)
                .eq("is_active", true);

            activeSlots = weeklySlots || [];
        }

        if (activeSlots.length === 0) {
            return NextResponse.json([]);
        }

        // 2. Get Existing Bookings for this day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: bookings } = await supabase
            .from("bookings")
            .select("start_time, end_time")
            .eq("instructor_id", instructorId)
            .eq("status", "confirmed")
            .gte("start_time", startOfDay.toISOString())
            .lte("end_time", endOfDay.toISOString());

        // 3. Generate Time Slots
        const timePoints: string[] = [];
        const now = new Date(); // To prevent booking in the past if today

        activeSlots.forEach(slot => {
            const [hours, mins] = slot.start_time.split(':').map(Number);
            const [endHours, endMins] = slot.end_time.split(':').map(Number);

            let current = new Date(date);
            current.setHours(hours, mins, 0, 0);

            let end = new Date(date);
            end.setHours(endHours, endMins, 0, 0);

            // Constraint: Slot + Duration must be <= End Time

            while (current < end) {
                const slotEnd = new Date(current.getTime() + durationMinutes * 60000);

                if (slotEnd > end) break;

                // Is in the past?
                if (current < now) {
                    current = new Date(slotEnd.getTime() + bufferMinutes * 60000); // Jump
                    continue;
                }

                // Check overlap with bookings
                const isBooked = bookings?.some(b => {
                    const bStart = new Date(b.start_time);
                    const bEnd = new Date(b.end_time);
                    // Standard overlap check: (StartA < EndB) and (EndA > StartB)
                    return (current < bEnd && slotEnd > bStart);
                });

                if (!isBooked) {
                    timePoints.push(current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
                }

                // Increment: Duration + Buffer
                current = new Date(slotEnd.getTime() + bufferMinutes * 60000);
            }
        });

        return NextResponse.json(timePoints);

    } catch (error) {
        console.error("Slots fetch error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
