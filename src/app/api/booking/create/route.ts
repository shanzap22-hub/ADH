import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/mail";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Check Tier Access
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier, email, full_name")
            .eq("id", user.id)
            .single();

        if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

        // Check if tier has access
        // Note: strict check dependent on schema. Assuming 'membership_tier' string matches 'tier' in tier_pricing
        const { data: tierInfo } = await supabase
            .from("tier_pricing")
            .select("has_booking_access")
            .eq("tier", profile.membership_tier) // Assuming value like 'gold', 'silver'
            .single();

        // Allow if Super Admin or Instructor too?
        // Or if tierInfo allows.
        const hasAccess = tierInfo?.has_booking_access;

        if (!hasAccess) {
            return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
        }

        const { instructorId, date, time } = await req.json();

        // 2. Convert Date+Time to ISO Timestamp
        // date: YYYY-MM-DD, time: HH:MM
        const startDateTime = new Date(`${date}T${time}:00`); // Local time implies needs timezone handling, defaulting to server local or UTC. 
        // Ideally frontend sends ISO. For MVP, assuming user/server timezone alignment or standard UTC.
        // Let's assume input is correct.

        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 min duration

        // 3. Create Booking
        const { data: booking, error } = await supabase
            .from("bookings")
            .insert({
                user_id: user.id,
                instructor_id: instructorId,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                status: 'confirmed',
                meeting_link: `https://meet.google.com/new`, // Mock link or integration
            })
            .select()
            .single();

        if (error) throw error;

        // 4. Send Email
        await sendBookingConfirmation(
            profile.email,
            profile.full_name,
            date,
            time,
            booking.meeting_link
        );

        return NextResponse.json({ success: true, bookingId: booking.id });
    } catch (error) {
        console.error("Booking creation error:", error);
        return NextResponse.json({ error: `Booking failed: ${(error as any).message}` }, { status: 500 });
    }
}
