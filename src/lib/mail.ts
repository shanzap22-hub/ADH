import { Resend } from 'resend';

// Only initialize if API key exists to avoid runtime errors during build
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const sendBookingConfirmation = async (
    email: string,
    name: string,
    date: string,
    time: string,
    meetingLink: string,
    bookingId: string,
    purpose?: string
) => {
    if (!resend) {
        console.log("DEBUG_MAIL: Resend API Key missing. Mocking email send.");
        return { success: true };
    }

    try {
        console.log("DEBUG_MAIL: Attempting to send email to:", email);
        const data = await resend.emails.send({
            from: "ADH Connect <info@adh.today>", // Updated to Verified Domain
            to: email,
            subject: "Booking Confirmed: 1-on-1 Session",
            html: `
                <h1>Booking Confirmation</h1>
                <p>Hi ${name},</p>
                <p>Your 1-on-1 session has been confirmed.</p>
                <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    ${purpose ? `<p><strong>Purpose:</strong> ${purpose}</p>` : ''}
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
            from: "ADH Connect <info@adh.today>",
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
            from: "ADH Connect <info@adh.today>",
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
            from: "ADH LMS <info@adh.today>",
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
            from: "ADH Connect <info@adh.today>", // Updated to Verified Domain
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

export const sendPaymentReceipt = async (
    email: string,
    name: string,
    amount: number,
    date: string,
    transactionId: string,
    couponCode?: string
) => {
    if (!resend) return { success: true };
    try {
        await resend.emails.send({
            from: "ADH Connect <info@adh.today>",
            to: email,
            subject: "Payment Receipt - Welcome to ADH Connect",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #000; padding: 20px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 24px;">ADH Connect</h1>
                    </div>
                    <div style="padding: 30px; background-color: #fff;">
                        <h2 style="color: #333; margin-top: 0;">Payment Receipt</h2>
                        <p style="color: #666;">Hi ${name},</p>
                        <p style="color: #666;">Thank you for joining ADH Connect. Here is your payment receipt.</p>
                        
                        <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${transactionId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Date:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${new Date(date).toLocaleDateString()}</td>
                                </tr>
                                ${couponCode ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Coupon Applied:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2ecc71;">${couponCode}</td>
                                </tr>
                                ` : ''}
                                <tr style="border-top: 2px solid #e9ecef;">
                                    <td style="padding: 12px 0; font-size: 16px; font-weight: bold; color: #333;">Total Amount Paid:</td>
                                    <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #000;">₹${amount}</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #666; font-size: 14px;">If you have any questions, simply reply to this email.</p>
                    </div>
                    <div style="background-color: #f1f3f5; padding: 15px; text-align: center; color: #868e96; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} ADH Connect. All rights reserved.
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (e) {
        console.error("DEBUG_MAIL: Receipt send error:", e);
        return { success: false, error: e };
    }
};

export const sendVerificationOTP = async (email: string, code: string) => {
    if (!resend) {
        console.log(`DEBUG: Mock OTP for ${email}: ${code}`);
        return { success: true };
    }
    try {
        await resend.emails.send({
            from: "ADH Connect <info@adh.today>",
            to: email,
            subject: "Verify your email address",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #333;">Verify Your Email</h2>
                    <p style="color: #666;">Please use the following code to verify your email address for ADH Connect.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="background: #f4f4f4; padding: 15px 25px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 6px; color: #000;">${code}</span>
                    </div>
                    <p style="color: #888; font-size: 14px;">This code will expire in 10 minutes.</p>
                </div>
            `
        });
        return { success: true };
    } catch (e) {
        console.error("DEBUG_MAIL: OTP send error:", e);
        return { success: false, error: e };
    }
};
