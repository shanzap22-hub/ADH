import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const {
            linkId,
            fullName,
            email,
            whatsappNumber,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = await req.json();

        if (
            !linkId ||
            !fullName ||
            !email ||
            !whatsappNumber ||
            !razorpay_payment_id ||
            !razorpay_order_id ||
            !razorpay_signature
        ) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpaySecret) {
            return NextResponse.json({ error: "Razorpay Secret Missing from server" }, { status: 500 });
        }

        // 1. Verify Signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto
            .createHmac("sha256", razorpaySecret)
            .update(text)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error("[LINK_VERIFY] Signature verification failed");
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // 2. Fetch Razorpay payment details to check capture status
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "",
            key_secret: razorpaySecret
        });

        let realAmount = 0;
        let paymentEmail = email;
        let paymentContact = whatsappNumber;

        try {
            const payment = await razorpay.payments.fetch(razorpay_payment_id);
            if (payment.status !== 'captured' && payment.status !== 'authorized') {
                console.error(`[LINK_VERIFY] Payment status was '${payment.status}'. Rejecting.`);
                return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
            }
            realAmount = Number(payment.amount);
            paymentContact = payment.contact as string || whatsappNumber;
        } catch (e: any) {
            console.error("[LINK_VERIFY] Failed to verify payment status on Razorpay:", e.message);
            return NextResponse.json({ error: "Failed to verify payment status" }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 3. Fetch payment link details to determine access grant
        const { data: link, error: linkError } = await supabaseAdmin
            .from("payment_links")
            .select("*")
            .eq("id", linkId)
            .single();

        if (linkError || !link) {
            return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
        }

        // 4. Update payments_temp table to record verified payment and clean up pending
        await supabaseAdmin.from("payments_temp").insert({
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            whatsapp_number: whatsappNumber,
            amount: realAmount,
            status: "verified",
        });

        await supabaseAdmin.from("payments_temp")
            .delete()
            .eq("order_id", razorpay_order_id)
            .eq("status", "pending");

        // 5. User lookup or creation based on target audience
        let userId: string | null = null;
        let isNewUser = false;
        const tempPassword = "ADH" + Math.random().toString(36).slice(-8) + "!";

        if (link.type === 'custom') {
            // Bypass user lookup/creation for custom payments
            userId = null;
        } else if (link.target_audience === 'existing') {
            // Search strictly by Email for existing students
            const { data: profileByEmail } = await supabaseAdmin
                .from("profiles")
                .select("id, email")
                .eq("email", email.toLowerCase().trim())
                .maybeSingle();

            if (!profileByEmail) {
                console.error("[LINK_VERIFY] Existing user profile not found for email:", email);
                return NextResponse.json({ error: "Existing student account not found for this email" }, { status: 400 });
            }

            userId = profileByEmail.id;

            // Update WhatsApp number if it is different
            await supabaseAdmin
                .from("profiles")
                .update({ whatsapp_number: whatsappNumber })
                .eq("id", userId);
        } else {
            // New Student Flow
            // Search by WhatsApp number first (similar to homepage checkouts)
            const cleanWhatsapp = whatsappNumber.replace(/\D/g, "");
            const whatsapp10Digit = (cleanWhatsapp.startsWith("91") && cleanWhatsapp.length === 12)
                ? cleanWhatsapp.slice(2)
                : (cleanWhatsapp.startsWith("0") ? cleanWhatsapp.slice(1) : cleanWhatsapp);

            const { data: profileByWhatsapp } = await supabaseAdmin
                .from("profiles")
                .select("id, email")
                .or(`whatsapp_number.eq.${cleanWhatsapp},whatsapp_number.eq.${whatsapp10Digit},whatsapp_number.eq.+${cleanWhatsapp},whatsapp_number.eq.+${whatsapp10Digit}`)
                .maybeSingle();

            if (profileByWhatsapp) {
                userId = profileByWhatsapp.id;
            } else {
                // Search by Email secondary
                const { data: profileByEmail } = await supabaseAdmin
                    .from("profiles")
                    .select("id, email")
                    .eq("email", email.toLowerCase().trim())
                    .maybeSingle();

                if (profileByEmail) {
                    userId = profileByEmail.id;
                    // Update WhatsApp number
                    await supabaseAdmin
                        .from("profiles")
                        .update({ whatsapp_number: whatsappNumber })
                        .eq("id", userId);
                } else {
                    // Profile does NOT exist in public.profiles.
                    // Check if Auth User exists in auth.users schema.
                    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
                    const supabaseAdminAuth = createSupabaseClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { db: { schema: 'auth' } }
                    );

                    const { data: existingAuthUser } = await supabaseAdminAuth
                        .from('users')
                        .select('id')
                        .eq('email', email.toLowerCase().trim())
                        .maybeSingle();

                    if (existingAuthUser) {
                        // Self-healing: Auth User exists but Profile is missing!
                        userId = existingAuthUser.id;
                        console.log("[LINK_VERIFY] Auth user exists but profile was missing. Self-healing by creating profile for ID:", userId);
                        
                        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
                            id: userId,
                            email: email.toLowerCase().trim(),
                            whatsapp_number: whatsappNumber,
                            phone_number: paymentContact,
                            role: 'student',
                            membership_tier: link.type === 'tier' ? link.target_id : 'silver',
                            setup_required: true, // REDIRECT to onboarding completion
                            full_name: fullName
                        });

                        if (profileError) {
                            console.error("[LINK_VERIFY] Self-healing profile creation failed:", profileError);
                            return NextResponse.json({ error: "Failed to restore profile" }, { status: 500 });
                        }
                    } else {
                        // User does not exist in Auth or Profiles, create a new auth user and profile
                        isNewUser = true;
                        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                            email: email.toLowerCase().trim(),
                            password: tempPassword,
                            email_confirm: true,
                            user_metadata: {
                                full_name: fullName,
                                whatsapp_number: whatsappNumber,
                                setup_required: true // REDIRECT to onboarding completion
                            }
                        });

                        if (createUserError || !newUser.user) {
                            console.error("[LINK_VERIFY] Auth user creation failed:", createUserError);
                            return NextResponse.json({ error: "Failed to create account credential" }, { status: 500 });
                        }

                        userId = newUser.user.id;

                        // Create profile
                        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
                            id: userId,
                            email: email.toLowerCase().trim(),
                            whatsapp_number: whatsappNumber,
                            phone_number: paymentContact,
                            role: 'student',
                            membership_tier: link.type === 'tier' ? link.target_id : 'silver',
                            setup_required: true, // REDIRECT to onboarding completion
                            full_name: fullName
                        });

                        if (profileError) {
                            console.error("[LINK_VERIFY] Profile creation failed:", profileError);
                            return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
                        }
                    }
                }
            }
        }

        // 6. Grant access based on payment link type
        if (link.type === 'tier') {
            // Upgrade/set membership tier
            const { error: tierError } = await supabaseAdmin
                .from("profiles")
                .update({
                    membership_tier: link.target_id,
                    role: 'student'
                })
                .eq("id", userId);

            if (tierError) {
                console.error("[LINK_VERIFY] Failed to update user membership tier:", tierError);
                return NextResponse.json({ error: "Failed to enroll user in membership tier" }, { status: 500 });
            }
        } else if (link.type === 'course') {
            // Enroll student in course (insert into purchases)
            // Fix duplicate enrollment error by using upsert
            const { error: purchaseError } = await supabaseAdmin
                .from("purchases")
                .upsert([
                    {
                        user_id: userId,
                        course_id: link.target_id
                    }
                ], { onConflict: "user_id,course_id" });

            if (purchaseError) {
                console.error("[LINK_VERIFY] Course enrollment failed:", purchaseError);
                return NextResponse.json({ error: "Failed to enroll user in program" }, { status: 500 });
            }
        }

        // 7. Insert record in transactions table
        const { error: txnError } = await supabaseAdmin.from('transactions').insert({
            user_id: userId || null,
            student_name: fullName,
            student_email: email.toLowerCase().trim(),
            whatsapp_number: whatsappNumber,
            amount: realAmount,
            currency: 'INR',
            status: 'verified',
            source: 'razorpay',
            razorpay_payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            membership_plan: link.type === 'tier' ? link.target_id : link.type === 'custom' ? 'custom' : 'silver',
            created_at: new Date().toISOString()
        });

        if (txnError) {
            console.error("[LINK_VERIFY] Transaction logging error (non-fatal):", txnError);
        }

        // 8. Try to sync to Google sheets if configured
        try {
            const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
            if (GOOGLE_SCRIPT_URL) {
                const payload = {
                    action: 'verify',
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    email: email.toLowerCase().trim(),
                    name: fullName,
                    phone: paymentContact,
                    whatsapp: whatsappNumber,
                    plan: link.type === 'tier' ? link.target_id : link.type === 'custom' ? 'custom' : 'silver',
                    amount: realAmount / 100,
                    status: 'verified',
                    created_at: new Date().toISOString()
                };

                fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }).catch(err => console.error("[LINK_VERIFY_SHEET_SYNC_ERROR]", err));
            }
        } catch (sheetErr) {
            console.error("Sheet Sync Logic Error", sheetErr);
        }

        return NextResponse.json({
            success: true,
            email: email.toLowerCase().trim(),
            tempPassword: isNewUser ? tempPassword : null,
            isNewUser: isNewUser
        });

    } catch (error: any) {
        console.error("[PAYMENT_LINK_VERIFY_ERROR]", error);
        return NextResponse.json({ error: "Payment verification process failed" }, { status: 500 });
    }
}
