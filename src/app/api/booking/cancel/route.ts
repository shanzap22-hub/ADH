import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { bookingId } = await req.json();

        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2. Fetch Booking and verify ownership (Student OR Instructor)
        const { data: booking } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

        // Check permissions
        if (booking.user_id !== user.id && booking.instructor_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 3. Sync with Google Calendar (Delete Event)
        // Need Instructor's Refresh Token
        try {
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: { user: instructorUser } } = await supabaseAdmin.auth.admin.getUserById(booking.instructor_id);
            const meta = instructorUser?.user_metadata || {};
            const refreshToken = meta.google_refresh_token;

            if (refreshToken) {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                // Delete Event using ID if available, otherwise search by Time
                if (booking.google_event_id) {
                    try {
                        await calendar.events.delete({
                            calendarId: 'primary',
                            eventId: booking.google_event_id
                        });
                        console.log("Google Calendar Event Deleted (ID Based):", booking.google_event_id);
                    } catch (delError: any) {
                        console.warn("Failed to delete by ID, falling back to search:", delError.message);
                        // Fallback logic could go here if needed, but usually ID failure means it's gone
                    }
                } else {
                    // Fallback: Find Event by Time
                    const startTime = new Date(booking.start_time).toISOString();
                    const endTime = new Date(booking.end_time).toISOString();

                    const events = await calendar.events.list({
                        calendarId: 'primary',
                        timeMin: startTime,
                        timeMax: endTime,
                        singleEvents: true,
                        q: "1-on-1 Mentorship" // Optional filter
                    });

                    const event = events.data.items?.[0]; // Assuming unique slot
                    if (event) {
                        await calendar.events.delete({
                            calendarId: 'primary',
                            eventId: event.id!
                        });
                        console.log("Google Calendar Event Deleted (Time Search):", event.id);
                    }
                }
            }
        } catch (error) {
            console.error("Google Sync Failed (Cancel):", error);
            // Non-blocking? User wants sync. But if fails, should we fail cancellation?
            // Converting it to console error for now, preventing cancel blockage.
        }

        // 4. Update Booking Status
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (error) throw error;

        // 5. Send Cancellation Emails
        try {
            // Fetch profiles
            const { data: student } = await supabase.from('profiles').select('email, full_name').eq('id', booking.user_id).single();
            const { data: instructor } = await supabase.from('profiles').select('email, full_name').eq('id', booking.instructor_id).single();

            // Format Date/Time for Email
            const startDt = new Date(booking.start_time);
            const dateStr = startDt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata' });
            const timeStr = startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

            // Import dynamically to avoid top-level issues if any
            const { sendBookingCancellation } = await import("@/lib/mail");

            if (student) await sendBookingCancellation(student.email, student.full_name, dateStr, timeStr);
            if (instructor) await sendBookingCancellation(instructor.email, instructor.full_name, dateStr, timeStr);

        } catch (mailError) {
            console.error("Mail Error (Cancel):", mailError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Cancel Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
