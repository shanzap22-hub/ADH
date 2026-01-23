import { Resend } from 'resend';

// Only initialize if API key exists to avoid runtime errors during build
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendBookingConfirmation = async (
    email: string,
    name: string,
    date: string,
    time: string,
    meetingLink: string,
    bookingId: string
) => {
    if (!resend) {
        console.log("DEBUG_MAIL: Resend API Key missing. Mocking email send.");
        return { success: true };
    }

    try {
        console.log("DEBUG_MAIL: Attempting to send email to:", email);
        const data = await resend.emails.send({
            from: "ADH Connect <booking@adh.today>", // Updated to Verified Domain
            to: email,
            subject: "Booking Confirmed: 1-on-1 Session",
            html: `
                <h1>Booking Confirmation</h1>
                <p>Hi ${name},</p>
                <p>Your 1-on-1 session has been confirmed.</p>
                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://adh.today/live" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reschedule Session</a>
                </div>
            `,
        });
        console.log("DEBUG_MAIL: Resend Response:", data);
        return { success: true, data };
    } catch (error) {
        console.error("DEBUG_MAIL: Email send error:", error);
        return { success: false, error };
    }
};

export const sendBookingCancellation = async (
    email: string,
    name: string,
    date: string,
    time: string
) => {
    if (!resend) return { success: true };
    try {
        await resend.emails.send({
            from: "ADH Connect <booking@adh.today>",
            to: email,
            subject: "Booking Cancelled: 1-on-1 Session",
            html: `
                <h1>Session Cancelled</h1>
                <p>Hi ${name},</p>
                <p>Your 1-on-1 session scheduled for <strong>${date} at ${time}</strong> has been cancelled.</p>
                <p>If you did not initiate this, please contact support or your instructor.</p>
            `,
        });
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
};

export const sendBookingRescheduled = async (
    email: string,
    name: string,
    oldDate: string,
    oldTime: string,
    newDate: string,
    newTime: string,
    meetLink: string
) => {
    if (!resend) return { success: true };
    try {
        await resend.emails.send({
            from: "ADH Connect <booking@adh.today>",
            to: email,
            subject: "Session Rescheduled: 1-on-1 Session",
            html: `
                <h1>Session Rescheduled</h1>
                <p>Hi ${name},</p>
                <p>Your session has been rescheduled.</p>
                <p><strong>Previous:</strong> ${oldDate} at ${oldTime}</p>
                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>New Date:</strong> ${newDate}</p>
                    <p><strong>New Time:</strong> ${newTime}</p>
                    <p><strong>Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
                </div>
            `,
        });
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
};

export const sendBookingReminder = async (
    email: string,
    name: string,
    date: string,
    time: string,
    meetLink: string,
    timeLeft: string // "3 hours", "30 minutes", "5 minutes"
) => {
    if (!resend) return { success: true };
    try {
        await resend.emails.send({
            from: "ADH LMS <booking@adh.today>",
            to: email,
            subject: `Reminder: Session in ${timeLeft}`,
            html: `
                <h1>Session Reminder</h1>
                <p>Hi ${name},</p>
                <p>You have a 1-on-1 session starting in <strong>${timeLeft}</strong>.</p>
                <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #c7d2fe;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p style="text-align:center;"><a href="${meetLink}" style="background-color: #4f46e5; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Meeting</a></p>
                </div>
            `,
        });
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
};

export const sendMail = async ({ to, subject, body }: { to: string; subject: string; body: string }) => {
    if (!resend) return { success: true };
    try {
        await resend.emails.send({
            from: "ADH Connect <onboarding@resend.dev>", // Using default for now to ensure delivery until domain verified
            to,
            subject,
            html: body
        });
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: e };
    }
};
