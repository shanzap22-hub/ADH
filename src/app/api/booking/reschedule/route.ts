
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { bookingId, newDate, newStartTime, newEndTime } = await req.json();

        // Validate
        if (!bookingId || !newDate || !newStartTime || !newEndTime) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Construct new ISO strings
        // Assuming dates are passed correctly as strings YYYY-MM-DD and HH:MM
        // Naive construction (Timezone implications exist but consistent with current app approach)
        const startDateTime = new Date(`${newDate}T${newStartTime}`);
        const endDateTime = new Date(`${newDate}T${newEndTime}`);

        // Update booking
        // Verify ownership: Ensure this booking belongs to the instructor (user.id)
        const { data: booking, error: fetchError } = await supabase
            .from("bookings")
            .select("id, instructor_id")
            .eq("id", bookingId)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.instructor_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { error: updateError } = await supabase
            .from("bookings")
            .update({
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                status: 'rescheduled' // Optional: Change status or keep 'confirmed'
            })
            .eq("id", bookingId);

        if (updateError) throw updateError;

        // Optional: Notify user (email)

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Reschedule error:", error);
        return NextResponse.json({ error: "Failed to reschedule" }, { status: 500 });
    }
}
