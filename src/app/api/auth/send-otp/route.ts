import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVerificationOTP } from "@/lib/mail";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

        // Validate email format basic
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }

        // Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Expires in 10 mins
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        // Store in DB: Delete old codes first to keep table clean
        const { error: delError } = await supabaseAdmin
            .from("verification_codes")
            .delete()
            .eq("email", email);

        if (delError) console.error("Error clearing old codes:", delError);

        const { error } = await supabaseAdmin.from("verification_codes").insert({
            email,
            code,
            expires_at: expiresAt
        });

        if (error) {
            console.error("DB Insert Error:", error);
            throw new Error("Database error while generating OTP");
        }

        // Send Email
        const sent = await sendVerificationOTP(email, code);

        if (!sent.success) {
            console.error("Mail Send Error:", sent.error);
            throw new Error("Failed to send verification email. Please try again.");
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Send OTP Error:", e);
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
    }
}
