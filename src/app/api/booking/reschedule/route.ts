import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { google } from "googleapis";
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { id, bookingId, newDate, newStartTime, newTime, instructorId, newEndTime } = await req.json();
        const targetId = bookingId || id;
        const targetTime = newStartTime || newTime;

        // Use Admin Client for ALL operations to ensure Instructor can update
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Fetch Booking
        const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id', targetId).single();

        if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

        // 2. Fetch Instructor Tokens (Use stored instructor_id from booking)
        const targetInstructorId = booking.instructor_id;
        const { data: { user: instructorUser } } = await supabaseAdmin.auth.admin.getUserById(targetInstructorId);

        const meta = instructorUser?.user_metadata || {};
        const refreshToken = meta.google_refresh_token;

        // 3. Sync with Google (if connected)
        if (refreshToken) {
            try {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET
                );
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

                // Sync Logic: Use ID if available, else Search
                let eventIdToUpdate = booking.google_event_id;

                if (!eventIdToUpdate) {
                    // Fallback: Search logic
                    const oldStart = new Date(booking.start_time);
                    const events = await calendar.events.list({
                        calendarId: 'primary',
                        timeMin: oldStart.toISOString(),
                        timeMax: new Date(oldStart.getTime() + 5 * 60000).toISOString(),
                        singleEvents: true
                    });
                    const event = events.data.items?.[0];
                    if (event) eventIdToUpdate = event.id;
                }

                if (eventIdToUpdate) {
                    // PATCH event
                    const isoStart = `${newDate}T${targetTime}:00+05:30`;
                    const startDt = new Date(isoStart);
                    let endDt;
                    if (newEndTime) {
                        endDt = new Date(`${newDate}T${newEndTime}:00+05:30`);
                    } else {
                        endDt = new Date(startDt.getTime() + 30 * 60000);
                    }

                    await calendar.events.patch({
                        calendarId: 'primary',
                        eventId: eventIdToUpdate,
                        requestBody: {
                            start: { dateTime: startDt.toISOString() },
                            end: { dateTime: endDt.toISOString() }
                        }
                    });
                    console.log("Google Event Rescheduled:", eventIdToUpdate);
                }
            } catch (gError) {
                console.error("Google Sync Error (Reschedule):", gError);
            }
        }

        // 4. Update DB
        const isoStart = `${newDate}T${targetTime}:00+05:30`;
        const startDt = new Date(isoStart);
        let endDt;
        if (newEndTime) {
            endDt = new Date(`${newDate}T${newEndTime}:00+05:30`);
        } else {
            endDt = new Date(startDt.getTime() + 30 * 60000);
        }

        const { error } = await supabaseAdmin
            .from('bookings')
            .update({
                start_time: startDt.toISOString(),
                end_time: endDt.toISOString(),
                status: 'confirmed',
                reminder_3h_sent: false,
                reminder_30m_sent: false,
                reminder_5m_sent: false
            })
            .eq('id', targetId);

        if (error) throw error;

        // 5. Send Reschedule Emails
        try {
            // Fetch profiles
            const { data: student } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', booking.user_id).single();
            const { data: instructor } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', booking.instructor_id).single();

            // Format old/new with Timezone
            const oldStart = new Date(booking.start_time);
            const oldDateStr = oldStart.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
            const oldTimeStr = oldStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

            const newStart = startDt;
            const newDateStr = newStart.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
            const newTimeStr = newStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

            const { sendBookingRescheduled } = await import("@/lib/mail");
            const link = booking.meet_link || "https://meet.google.com";

            if (student) await sendBookingRescheduled(student.email, student.full_name, oldDateStr, oldTimeStr, newDateStr, newTimeStr, link);
            if (instructor) await sendBookingRescheduled(instructor.email, instructor.full_name, oldDateStr, oldTimeStr, newDateStr, newTimeStr, link);
        } catch (mailError) {
            console.error("Mail Error (Reschedule):", mailError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Reschedule Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
