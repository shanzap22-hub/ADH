import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingReminder } from "@/lib/mail";

// Use Admin Client to bypass RLS and update system flags
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    // 1. Verify Cron Secret (Security)
    // Support both Header (Vercel) and Query Param (External Cron)
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get('key');

    const isValid = (authHeader === `Bearer ${process.env.CRON_SECRET}`) || (queryKey === process.env.CRON_SECRET);

    if (!isValid) {
        // Allow manual testing if CRON_SECRET is not set, or reject
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const now = new Date();
        const results = { sent3h: 0, sent30m: 0, sent5m: 0 };

        // Helper to process batch
        const processBatch = async (
            label: string,
            minTime: Date,
            maxTime: Date,
            flagColumn: string,
            timeLeftText: string
        ) => {
            const { data: bookings, error } = await supabaseAdmin
                .from('bookings')
                .select(`
                    id, 
                    start_time, 
                    meet_link,
                    user_id, instructor_id,
                    student:profiles!bookings_user_id_fkey(email, full_name, phone, mobile, contact_number, whatsapp_number),
                    instructor:profiles!bookings_instructor_id_fkey(email, full_name)
                `)
                .eq('status', 'confirmed')
                .eq(flagColumn, false)
                .gte('start_time', minTime.toISOString())
                .lte('start_time', maxTime.toISOString());

            if (error) {
                console.error(`Error fetching ${label} bookings:`, error);
                return 0;
            }

            if (!bookings || bookings.length === 0) return 0;

            console.log(`Found ${bookings.length} bookings for ${label} reminder.`);

            // ഇമെയിൽ ഡിസ്പാച്ചുകൾ പാരലൽ ആയി അയക്കുന്നു (നെറ്റ്‌വർക്ക് വൈകൽ ഇല്ലാതാക്കാൻ)
            await Promise.all(bookings.map(async (booking) => {
                try {
                    const startDt = new Date(booking.start_time);
                    const dateStr = startDt.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
                    const timeStr = startDt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
                    const link = booking.meet_link || "https://meet.google.com";

                    // Resolve Student Details
                    const s: any = booking.student;
                    const i: any = booking.instructor;
                    
                    const sPhone = s ? (s.phone || s.mobile || s.contact_number || s.whatsapp_number || "N/A") : "N/A";
                    const studentDetails = s ? { name: s.full_name, email: s.email, phone: sPhone } : undefined;

                    const emailPromises: Promise<any>[] = [];

                    // Send to Student
                    if (s) {
                        emailPromises.push(sendBookingReminder(
                            s.email,
                            s.full_name,
                            dateStr, timeStr, link, timeLeftText,
                            studentDetails
                        ));
                    }
                    // Send to Instructor
                    if (i) {
                        emailPromises.push(sendBookingReminder(
                            i.email,
                            i.full_name,
                            dateStr, timeStr, link, timeLeftText,
                            studentDetails
                        ));
                    }

                    await Promise.all(emailPromises);
                } catch (err) {
                    console.error(`Error sending reminder for booking ${booking.id}:`, err);
                }
            }));

            // ഒരൊറ്റ സുപബേസ് അപ്‌ഡേറ്റ് ക്വറിയിലൂടെ എല്ലാ ഫ്ലാഗുകളും ഒരുമിച്ച് മാറ്റുന്നു (ഡാറ്റാബേസ് ലോഡ് കുറയ്ക്കാൻ)
            const bookingIds = bookings.map(b => b.id);
            const { error: updateError } = await supabaseAdmin
                .from('bookings')
                .update({ [flagColumn]: true })
                .in('id', bookingIds);

            if (updateError) {
                console.error(`Error batch updating booking flags:`, updateError);
            }

            return bookings.length;
        };

        // -----------------------------------------------------
        // 1. 3 Hours Reminder 
        // Window: [Now + 2h 50m, Now + 3h 10m]
        // This targets slots roughly 3 hours from now.
        // -----------------------------------------------------
        // -----------------------------------------------------
        // 1. 3 Hours Reminder 
        // Window: [Now + 60m, Now + 4h]
        // Catch anything roughly 1-4 hours away if not sent
        // -----------------------------------------------------
        const t3h_start = new Date(now.getTime() + (60 * 60000));
        const t3h_end = new Date(now.getTime() + (240 * 60000));
        results.sent3h = await processBatch('3H', t3h_start, t3h_end, 'reminder_3h_sent', '3 hours');

        // -----------------------------------------------------
        // 2. 30 Minutes Reminder
        // Window: [Now + 20m, Now + 60m]
        // Catch anything 20m to 1h away
        // -----------------------------------------------------
        const t30m_start = new Date(now.getTime() + (20 * 60000));
        const t30m_end = new Date(now.getTime() + (60 * 60000));
        results.sent30m = await processBatch('30M', t30m_start, t30m_end, 'reminder_30m_sent', '30 minutes');

        // -----------------------------------------------------
        // 3. 5 Minutes Reminder (Urgent)
        // Window: [Now, Now + 20m]
        // Catch anything starting soon (0-20m)
        // -----------------------------------------------------
        const t5m_start = new Date(now.getTime()); // From Now
        const t5m_end = new Date(now.getTime() + (20 * 60000)); // Up to 20m
        results.sent5m = await processBatch('5M', t5m_start, t5m_end, 'reminder_5m_sent', '5 minutes');

        return NextResponse.json({ success: true, processed: results });

    } catch (e: any) {
        console.error("Cron Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
