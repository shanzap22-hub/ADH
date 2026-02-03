import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getNotificationSettings, sendOneSignalNotification } from "@/lib/notifications";

// Initialize Supabase Admin Client (Service Role)
// CRITICAL: Must use Service Role Key to bypass RLS and update 'reminder_sent' flags for any user's data
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    // 1. Verify Vercel Cron (Optional but recommended)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const settings = await getNotificationSettings();
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const fifteenMinsLater = new Date(now.getTime() + 15 * 60 * 1000);

        const results = {
            live_reminders: 0,
            live_start: 0,
            one_on_one_reminders: 0
        };

        // ==========================================
        // 2. Weekly Live Reminders (approx 1 hour before)
        // ==========================================
        if (settings.live_reminders) {
            const { data: upcomingLives } = await supabaseAdmin
                .from("weekly_live_sessions")
                .select("*")
                .gt("scheduled_at", now.toISOString())
                .lt("scheduled_at", oneHourLater.toISOString())
                .eq("reminder_sent", false);

            if (upcomingLives && upcomingLives.length > 0) {
                for (const session of upcomingLives) {
                    await sendOneSignalNotification(
                        "⏰ Mastermind Reminder",
                        `"${session.title}" starts in less than an hour! Get ready to join.`,
                        ['All'],
                        { url: session.join_url }
                    );

                    // Mark as sent
                    await supabaseAdmin
                        .from("weekly_live_sessions")
                        .update({ reminder_sent: true })
                        .eq("id", session.id);

                    results.live_reminders++;
                }
            }
        }

        // ==========================================
        // 3. Weekly Live Start (When it starts)
        // ==========================================
        if (settings.live_start) {
            // Check sessions that passed scheduled_at recently (e.g. within last 15 mins)
            const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

            const { data: startedLives } = await supabaseAdmin
                .from("weekly_live_sessions")
                .select("*")
                .lt("scheduled_at", now.toISOString()) // Already passed start time
                .gt("scheduled_at", fifteenMinsAgo.toISOString()) // But not too long ago
                .eq("start_notification_sent", false);

            if (startedLives && startedLives.length > 0) {
                for (const session of startedLives) {
                    await sendOneSignalNotification(
                        "🔴 Live Now!",
                        `"${session.title}" has started. Join the session now!`,
                        ['All'],
                        { url: session.join_url }
                    );

                    await supabaseAdmin
                        .from("weekly_live_sessions")
                        .update({ start_notification_sent: true })
                        .eq("id", session.id);

                    results.live_start++;
                }
            }
        }

        // ==========================================
        // 4. 1-on-1 Session Start Reminder (approx 15 mins before)
        // ==========================================
        if (settings.one_on_one) {
            // Need to join profile to get instructor name? Or just generic message.
            // Using service role, so we can fetch bookings.
            const { data: upcomingBookings } = await supabaseAdmin
                .from("bookings")
                .select("*, instructor:profiles!instructor_id(full_name)")
                .eq("status", "confirmed")
                .gt("start_time", now.toISOString())
                .lt("start_time", fifteenMinsLater.toISOString())
                .eq("reminder_sent", false);

            if (upcomingBookings && upcomingBookings.length > 0) {
                for (const booking of upcomingBookings) {
                    // Notify User
                    await sendOneSignalNotification(
                        "Starting Soon ⏳",
                        `Your 1-on-1 with ${booking.instructor?.full_name || 'Instructor'} starts in 15 minutes.`,
                        undefined,
                        { url: booking.meet_link || '/dashboard' },
                        [booking.user_id]
                    );

                    // Notify Instructor
                    await sendOneSignalNotification(
                        "Session Reminder ⏳",
                        `Your session starts in 15 minutes.`,
                        undefined,
                        { url: booking.meet_link || '/dashboard' },
                        [booking.instructor_id]
                    );

                    await supabaseAdmin
                        .from("bookings")
                        .update({ reminder_sent: true })
                        .eq("id", booking.id);

                    results.one_on_one_reminders++;
                }
            }
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
