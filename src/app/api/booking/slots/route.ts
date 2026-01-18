import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const instructorId = searchParams.get("instructorId");
    const isDebug = searchParams.get("debug") === "true";

    if (!dateStr || !instructorId) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const debugLogs: any[] = [];
    const log = (msg: string, data?: any) => {
        if (isDebug) debugLogs.push({ msg, data });
    };

    try {
        const supabase = await createClient();
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0-6

        // 0. Get Instructor Settings (Duration, Buffer, Min Notice)
        const { data: settings } = await supabase
            .from("instructor_booking_settings")
            .select("*")
            .eq("instructor_id", instructorId)
            .single();

        const durationMinutes = settings?.slot_duration || 30;
        const bufferMinutes = settings?.buffer_time || 5;
        const minNotice = settings?.min_notice_time || 60; // Default 60 minutes

        // Calculate Minimum Bookable Time
        // Students can only book if slot Start Time > Now + Min Notice
        const now = new Date();
        const minBookableTime = new Date(now.getTime() + minNotice * 60000);

        // 1. Get Availability (Check Overrides FIRST, then Weekly)
        const { data: overrides } = await supabase
            .from("availability_overrides")
            .select("*")
            .eq("instructor_id", instructorId)
            .eq("specific_date", dateStr);

        let activeSlots: any[] = [];

        if (overrides && overrides.length > 0) {
            activeSlots = overrides.filter(o => o.is_available);
            log("Using Overrides", activeSlots);
        } else {
            const { data: weeklySlots } = await supabase
                .from("availability_slots")
                .select("*")
                .eq("instructor_id", instructorId)
                .eq("day_of_week", dayOfWeek)
                .eq("is_active", true);

            activeSlots = weeklySlots || [];
            log("Using Weekly", activeSlots);
        }

        if (activeSlots.length === 0) {
            if (isDebug) return NextResponse.json({ debugLogs, result: [] });
            return NextResponse.json([]);
        }

        // 2. Get Existing Bookings
        const checkStart = new Date(date);
        checkStart.setDate(checkStart.getDate() - 2);
        const checkEnd = new Date(date);
        checkEnd.setDate(checkEnd.getDate() + 2);

        const { data: bookings } = await supabase
            .from("bookings")
            .select("start_time, end_time")
            .eq("instructor_id", instructorId)
            .eq("status", "confirmed")
            .gte("start_time", checkStart.toISOString())
            .lte("end_time", checkEnd.toISOString());

        log("Fetched Bookings", bookings);

        // 3. Generate Time Slots
        const timePoints: string[] = [];
        const nowMs = Date.now();
        const bufferMs = 2 * 60000;

        activeSlots.forEach(slot => {
            // IST Fix: Ensure strict HH:MM input to avoid double seconds (e.g. 18:00:00:00)
            const startHM = slot.start_time.substring(0, 5); // "18:00"
            const endHM = slot.end_time.substring(0, 5);     // "20:49"

            const startTimeStr = `${dateStr}T${startHM}:00+05:30`;
            const endTimeStr = `${dateStr}T${endHM}:00+05:30`;

            let current = new Date(startTimeStr);
            let end = new Date(endTimeStr);

            // Safety Check
            if (isNaN(current.getTime())) {
                log("Invalid Date Created", startTimeStr);
                return;
            }

            // 1. Dynamic Start Adjustment
            // If the availability window starts effectively in the past (vs Min Notice),
            // Start the grid from the earliest possible bookable time (rounded to 5 mins).
            if (current.getTime() < minBookableTime.getTime()) {
                const mbMs = minBookableTime.getTime();
                const remainder = mbMs % 300000; // 5 mins in ms
                const roundUp = remainder === 0 ? 0 : (300000 - remainder);
                const newStartMs = mbMs + roundUp;

                // Only shift if the new start is still within the availability window
                // And ideally, user should only see this if they are looking at "Today".
                // But this logic applies naturally.
                if (newStartMs < end.getTime()) {
                    current = new Date(newStartMs);
                    log("Shifted Grid Start to MinBookable", current.toISOString());
                }
            }

            log("Slot Generation Scope", { start: current.toISOString(), end: end.toISOString() });

            // Loop: Find First Available Logic
            while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {
                const currentMs = current.getTime();
                const slotEndMs = currentMs + durationMinutes * 60000;

                // Min Notice Check (Redundant if we shifted, but safe)
                if (currentMs < minBookableTime.getTime()) {
                    // Should not happen with shift logic, but move forward just in case
                    // Round up to next 5 mins
                    const remainder = currentMs % 300000;
                    const roundUp = remainder === 0 ? 0 : (300000 - remainder);
                    // If we are already aligned, add 5 mins? No, jump to minBookable
                    current = new Date(minBookableTime.getTime() + (300000 - minBookableTime.getTime() % 300000));
                    continue;
                }

                // Check Overlap with Bookings
                // We find ANY booking that overlaps our proposed slot
                const overlappingBooking = bookings?.find(b => {
                    const bStart = new Date(b.start_time).getTime();
                    const bEnd = new Date(b.end_time).getTime();
                    return (currentMs < bEnd && slotEndMs > bStart);
                });

                if (overlappingBooking) {
                    const bEnd = new Date(overlappingBooking.end_time).getTime();
                    log("Hit Booking, Jumping", {
                        slot: current.toISOString(),
                        bookingEnd: overlappingBooking.end_time
                    });

                    // Jump to Booking End + Buffer
                    // And restart grid from there
                    current = new Date(bEnd + bufferMinutes * 60000);

                    // Rounding for neatness after booking? (Optional but good)
                    // If booking ends at 2:47, new start 2:52.
                    // Let's round to next 5 mins for cleaner slots?
                    // const rem = current.getTime() % 300000;
                    // if (rem !== 0) current = new Date(current.getTime() + (300000 - rem));

                    continue;
                }

                // No Overlap -> Valid Slot
                // Format
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                const timeStr = formatter.format(current);
                const [rawH, rawM] = timeStr.split(':');
                const h = rawH.trim().padStart(2, '0');
                const m = rawM.trim().padStart(2, '0');

                timePoints.push(`${h}:${m}`);
                log("Added Slot", `${h}:${m}`);

                // Move to next slot
                current = new Date(slotEndMs + bufferMinutes * 60000);
            }
        });

        if (isDebug) {
            return NextResponse.json({
                activeSlots,
                bookings,
                timePoints,
                debugLogs
            });
        }

        return NextResponse.json(timePoints);

    } catch (error: any) {
        console.error("Slots fetch error:", error);
        return NextResponse.json({ error: "Failed", details: error.message }, { status: 500 });
    }
}
