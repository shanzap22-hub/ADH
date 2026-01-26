
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
// No other imports needed

export async function POST(req: Request) {
    try {
        console.log("[FINALIZE_ENROLLMENT] === Starting Enrollment Process ===");

        const body = await req.json();
        // Only whatsappNumber is used for minimal profile creation
        const { fullName, email, contactNumber, whatsappNumber, paymentId } = body;

        console.log("[FINALIZE_ENROLLMENT] Received data:", {
            fullName,
            email,
            hasPaymentId: !!paymentId,
            hasPassword: false // Password is no longer directly passed in this flow
        });

        // Validate required fields
        if (!whatsappNumber || !paymentId) {
            console.error("[FINALIZE_ENROLLMENT] Missing required fields: paymentId or whatsappNumber");
            return NextResponse.json(
                { error: "Payment ID and WhatsApp Number are required" },
                { status: 400 }
            );
        }

        // Create admin Supabase client with service role
        const supabaseAdmin = createAdminClient();

        console.log("[FINALIZE_ENROLLMENT] Admin client created");

        // STEP 0: Verify Payment ID fits a valid, verified transaction
        // CRITICAL SECURITY FIX
        const { data: paymentRecord, error: paymentError } = await supabaseAdmin
            .from("payments_temp")
            .select("*")
            .eq("payment_id", paymentId)
            .eq("status", "verified") // Must be verified by Razorpay webhook/verify API
            .single();

        if (paymentError || !paymentRecord) {
            console.error("[FINALIZE_ENROLLMENT] Invalid or unverified payment ID:", paymentId);
            return NextResponse.json(
                { error: "Security Error: Invalid or Unverified Payment ID" },
                { status: 403 }
            );
        }

        // Create Razorpay instance to fetch details
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Razorpay = require("razorpay");
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_StqvqJ8w5pW5kK",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "IT6mwpTe3Hxzu8Kml0xwd9rg"
        });

        let finalEmail = email;
        let finalContact = contactNumber;

        // If data missing, fetch from Razorpay
        if (!finalEmail) {
            console.log("[FINALIZE_ENROLLMENT] Fetching details from Razorpay...");
            try {
                const payment = await instance.payments.fetch(paymentId);
                finalEmail = payment.email;
                finalContact = payment.contact;
                console.log("[FINALIZE_ENROLLMENT] Fetched:", { finalEmail, finalContact });
            } catch (e) {
                console.error("[FINALIZE_ENROLLMENT] Failed to fetch Razorpay details:", e);
                return NextResponse.json({ error: "Failed to fetch payment details" }, { status: 500 });
            }
        }

        if (!finalEmail) {
            console.warn("[FINALIZE_ENROLLMENT] Email not found in payment details. Generating placeholder.");
            // Generate a unique placeholder email using WhatsApp number to allow profile creation
            finalEmail = `${whatsappNumber}@adh.pending`;
        }

        console.log("[FINALIZE_ENROLLMENT] Checking if user exists (Priority: WhatsApp)...");
        let userId = "";
        let isNewUser = false;
        const tempPassword = "ADH" + Math.random().toString(36).slice(-8) + "!";

        const { data: profileByWhatsapp } = await supabaseAdmin
            .from("profiles")
            .select("id, email")
            .eq("whatsapp_number", whatsappNumber)
            .maybeSingle();

        if (profileByWhatsapp) {
            console.log("[FINALIZE_ENROLLMENT] Found existing user by WhatsApp:", profileByWhatsapp.id);
            userId = profileByWhatsapp.id;
        } else {
            // Secondary Check: Email
            const { data: profileByEmail } = await supabaseAdmin
                .from("profiles")
                .select("id, email")
                .eq("email", finalEmail)
                .maybeSingle();

            if (profileByEmail) {
                console.log("[FINALIZE_ENROLLMENT] Found existing user by Email:", profileByEmail.id);
                userId = profileByEmail.id;
                // Update WhatsApp number for existing user
                await supabaseAdmin.from("profiles").update({ whatsapp_number: whatsappNumber }).eq("id", userId);
            } else {
                // Create New User
                console.log("[FINALIZE_ENROLLMENT] Creating New Auth User:", finalEmail);
                isNewUser = true;

                // 1. Create Auth User first (Required for Foreign Key in Profiles)
                const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                    email: finalEmail,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: fullName || "Student",
                        whatsapp_number: whatsappNumber
                    }
                });

                if (createUserError || !newUser.user) {
                    console.error("[FINALIZE_ENROLLMENT] Auth user creation failed:", createUserError);
                    // Check if user already exists but we missed it (race condition)
                    if (createUserError?.message?.includes("already registered")) {
                        // Try to get user again? Or fail gracefully
                        return NextResponse.json({ error: "User already exists. Please login." }, { status: 409 });
                    }
                    return NextResponse.json({ error: "Failed to create account credential" }, { status: 500 });
                }

                userId = newUser.user.id;
                console.log("[FINALIZE_ENROLLMENT] Auth User Created. ID:", userId);

                // 2. Create Profile (Now linked to Auth ID)
                const { error: insertError } = await supabaseAdmin.from("profiles").insert({
                    id: userId,
                    email: finalEmail.toLowerCase().trim(),
                    whatsapp_number: whatsappNumber,
                    contact_number: finalContact,
                    role: 'student',
                    membership_tier: 'bronze',
                    setup_required: true,
                    full_name: fullName || "Student"
                });

                if (insertError) {
                    console.error("[FINALIZE_ENROLLMENT] Profile creation failed:", insertError);
                    // Rollback auth user? (Optional but good practice)
                    // await supabaseAdmin.auth.admin.deleteUser(userId);
                    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
                }
            }
        }

        // Return success with temp password for new users
        return NextResponse.json({
            success: true,
            userId: userId,
            email: finalEmail,
            tempPassword: isNewUser ? tempPassword : null,
            isNewUser: isNewUser
        });

    } catch (error: any) {
        console.error("[FINALIZE_ENROLLMENT] === FATAL ERROR ===", error);
        return NextResponse.json({ error: "Server error during enrollment", details: error.message }, { status: 500 });
    }
}
