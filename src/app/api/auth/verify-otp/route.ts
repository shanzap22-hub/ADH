import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ error: "Email and code required" }, { status: 400 });
        }

        // Fetch code
        const { data, error } = await supabaseAdmin
            .from("verification_codes")
            .select("*")
            .eq("email", email)
            .eq("code", code)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        // Check expiration
        if (new Date(data.expires_at) < new Date()) {
            return NextResponse.json({ error: "Verification code has expired. Please request a new one." }, { status: 400 });
        }

        // Cleanup: Valid code used, delete it.
        await supabaseAdmin.from("verification_codes").delete().eq("email", email);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Verify OTP Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
