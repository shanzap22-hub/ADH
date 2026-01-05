import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { fullName, email, contactNumber, whatsappNumber, paymentId } = await req.json();

        // Validate required fields
        if (!fullName || !email || !contactNumber || !whatsappNumber || !paymentId) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Check if payment exists and is verified
        const { data: paymentData, error: paymentError } = await supabase
            .from("payments_temp")
            .select("*")
            .eq("payment_id", paymentId)
            .eq("status", "verified")
            .single();

        if (paymentError || !paymentData) {
            return NextResponse.json(
                { error: "Invalid or unverified payment" },
                { status: 400 }
            );
        }

        // Create user account in Supabase Auth
        const tempPassword = Math.random().toString(36).slice(-12) + "A1!"; // Random password

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password: tempPassword,
            options: {
                data: {
                    full_name: fullName,
                    contact_number: contactNumber,
                    whatsapp_number: whatsappNumber,
                },
                emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        });

        if (signUpError) {
            console.error("[SIGNUP_ERROR]", signUpError);
            return NextResponse.json(
                { error: "Failed to create account: " + signUpError.message },
                { status: 500 }
            );
        }

        if (!authData.user) {
            return NextResponse.json(
                { error: "Failed to create user" },
                { status: 500 }
            );
        }

        // Update profile with additional details
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: fullName,
                contact_number: contactNumber,
                whatsapp_number: whatsappNumber,
                role: "student",
            })
            .eq("id", authData.user.id);

        if (profileError) {
            console.error("[PROFILE_UPDATE_ERROR]", profileError);
        }

        // Create purchase record
        const { error: purchaseError } = await supabase.from("purchases").insert({
            user_id: authData.user.id,
            course_id: "all_courses", // Special marker for bundle purchase
            payment_id: paymentId,
            amount: 499900,
            status: "completed",
        });

        if (purchaseError) {
            console.error("[PURCHASE_ERROR]", purchaseError);
        }

        // Delete from temp table
        await supabase.from("payments_temp").delete().eq("payment_id", paymentId);

        // Sign the user in
        await supabase.auth.signInWithPassword({
            email,
            password: tempPassword,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[ONBOARDING_COMPLETE]", error);
        return NextResponse.json(
            { error: "Failed to complete registration" },
            { status: 500 }
        );
    }
}
