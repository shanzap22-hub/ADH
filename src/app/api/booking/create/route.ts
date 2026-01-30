import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { google } from "googleapis";
import { sendBookingConfirmation } from "@/lib/mail";
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { date, time, instructorId, purpose } = await req.json();

        if (!date || !time || !instructorId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch User Profile (Student)
        const { data: student } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .single();

        if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

        // 2. Fetch Instructor Profile (Need email for Calendar Invite)
        const { data: instructor } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", instructorId)
            .single();

        if (!instructor) return NextResponse.json({ error: "Instructor not found" }, { status: 404 });

        // 3. Time Construction (IST)
        const startDateTime = new Date(`${date}T${time}:00+05:30`);
        const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins

        if (isNaN(startDateTime.getTime())) {
            return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
        }

        // 4. Double Booking Check
        const { data: existing } = await supabase
            .from("bookings")
            .select("id")
            .or(`user_id.eq.${user.id},instructor_id.eq.${instructorId}`)
            .eq("start_time", startDateTime.toISOString())
            .eq("status", "confirmed")
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: "Slot is already booked or you have a conflict." }, { status: 409 });
        }

        // 5. Google Calendar Sync via OAuth (Instructor's Token)
        let meetLink = `https://meet.google.com/new?booking_id=${Date.now()}`; // Initial Fallback
        let googleError = null;
        let googleEventId = null;

        try {
            // A. Get Instructor's Refresh Token using Admin Client
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: instructorUserData, error: adminError } = await supabaseAdmin.auth.admin.getUserById(instructorId);

            if (adminError || !instructorUserData.user) {
                throw new Error("Could not fetch Instructor Identity for Calendar Sync");
            }

            // Find Google Identity (for fallback/info)
            const googleIdentity = instructorUserData.user.identities?.find((id) => id.provider === 'google');

            // Extract Tokens from User Metadata (Manually persisted in Auth Callback)
            // Fallback to identities if metadata is missing (legacy)
            const meta = instructorUserData.user.user_metadata || {};
            const refreshToken = meta.google_refresh_token || googleIdentity?.identity_data?.provider_refresh_token;
            const accessToken = meta.google_access_token || googleIdentity?.identity_data?.provider_token;

            if (!refreshToken && !accessToken) {
                console.error("Instructor Google Tokens missing in Metadata & Identity. Metadata Keys:", Object.keys(meta));
                return NextResponse.json({
                    error: "Instructor Authentication Error: Please Logout and Login again to grant Calendar permissions."
                }, { status: 401 });
            }

            // B. Setup Google OAuth Client
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );

            if (refreshToken) {
                oauth2Client.setCredentials({ refresh_token: refreshToken });
            } else if (accessToken) {
                console.log("Using Access Token for Calendar Sync (Refresh Token missing)");
                oauth2Client.setCredentials({ access_token: accessToken });
            }

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            // C. Create Event on Instructor's Primary Calendar
            const requestId = crypto.randomBytes(8).toString('hex');
            const event = {
                summary: `1-1 Session: ${student.full_name} with ${instructor.full_name}`,
                description: `ADH Connect Booking.\nStudent: ${student.full_name} (${student.email})\nInstructor: ${instructor.full_name}\n\nPurpose: ${purpose || "Not specified"}`,
                start: { dateTime: startDateTime.toISOString() },
                end: { dateTime: endDateTime.toISOString() },
                guestsCanModify: false,
                attendees: [{ email: student.email }], // Now we CAN invite student because acting as User!
                conferenceData: {
                    createRequest: {
                        requestId: requestId,
                        conferenceSolutionKey: { type: 'hangoutsMeet' }
                    }
                }
            };

            const calRes = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1,
                sendUpdates: 'all', // Can send invites now!
            });

            console.log("OAuth Calendar Event Created:", calRes.data.htmlLink);
            googleEventId = calRes.data.id; // Capture ID

            if (calRes.data.hangoutLink) {
                meetLink = calRes.data.hangoutLink;
                console.log("Generated Meet Link:", meetLink);
            } else {
                console.warn("Google API returned no hangoutLink. Full Response Data:", JSON.stringify(calRes.data));
                throw new Error("Failed to generate Google Meet Link (API returned empty link). Ensure Calendar settings allow video calls.");
            }
        } catch (calError: any) {
            console.error("Google OAuth Calendar Sync Failed:", calError);
            const errorMsg = calError.response?.data?.error?.message || calError.message;
            return NextResponse.json({ error: `Google Calendar Error: ${errorMsg}` }, { status: 500 });
        }

        // 6. Insert into DB (Try with purpose, fallback if column missing)
        let booking;
        try {
            const { data, error: dbError } = await supabase
                .from("bookings")
                .insert({
                    user_id: user.id,
                    instructor_id: instructorId,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    status: 'confirmed',
                    meet_link: meetLink,
                    google_event_id: googleEventId, // Use Captured ID
                    purpose: purpose || null
                })
                .select()
                .single();

            if (dbError) throw dbError;
            booking = data;

        } catch (dbError: any) {
            // Fallback: If 'purpose' column doesn't exist, insert without it
            if (dbError.message?.includes('purpose') || dbError.code === 'PGRST204') {
                console.warn("Booking Warn: 'purpose' column missing. Inserting without it.");
                const { data, error: retryError } = await supabase
                    .from("bookings")
                    .insert({
                        user_id: user.id,
                        instructor_id: instructorId,
                        start_time: startDateTime.toISOString(),
                        end_time: endDateTime.toISOString(),
                        status: 'confirmed',
                        meet_link: meetLink,
                        google_event_id: googleEventId
                    })
                    .select()
                    .single();

                if (retryError) throw retryError;
                booking = data;
            } else {
                throw dbError;
            }
        }

        // 7. Send Email (Format Time to 12h AM/PM)
        const formatTime12h = (time24: string) => {
            const [h, m] = time24.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${m} ${ampm}`;
        };
        const time12h = formatTime12h(time);

        try {
            await sendBookingConfirmation(
                student.email,
                student.full_name,
                date,
                time12h,
                meetLink,
                booking.id,
                purpose
            );

            await sendBookingConfirmation(
                instructor.email,
                instructor.full_name,
                date,
                time12h,
                meetLink,
                booking.id,
                purpose
            );
        } catch (mailError) {
            console.error("Mail Error:", mailError);
        }

        return NextResponse.json({ success: true, bookingId: booking.id, meetLink, googleError });

    } catch (error: any) {
        console.error("Booking Error:", error);
        return NextResponse.json({ error: error.message || "Failed to book" }, { status: 500 });
    }
}
