import { Resend } from 'resend';

// Only initialize if API key exists to avoid runtime errors during build
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendBookingConfirmation = async (
    email: string,
    name: string,
    date: string,
    time: string,
    meetingLink: string
) => {
    if (!resend) {
        console.log("Resend API Key missing. Mocking email send:", { email, date, time });
        return { success: true };
    }

    try {
        await resend.emails.send({
            from: "ADH LMS <onboarding@resend.dev>", // Update with verified domain later
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
                <p>To cancel or reschedule, please log in to your dashboard.</p>
            `,
        });
        return { success: true };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error };
    }
};
