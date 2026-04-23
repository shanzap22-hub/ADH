import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, whatsappNumber } = await req.json();

        console.log("[RAZORPAY_VERIFY] Payment verification started");
        console.log("[RAZORPAY_VERIFY] Payment ID:", razorpay_payment_id);
        console.log("[RAZORPAY_VERIFY] Order ID:", razorpay_order_id);

        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpaySecret) throw new Error("Razorpay Secret Missing");

        console.log("[RAZORPAY_VERIFY] Using secret from ENV");

        // Verify signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto
            .createHmac("sha256", razorpaySecret)
            .update(text)
            .digest("hex");

        console.log("[RAZORPAY_VERIFY] Received signature:", razorpay_signature);

        const isValidSignature = generatedSignature === razorpay_signature;

        if (!isValidSignature) {
            console.error("[RAZORPAY_VERIFY] Signature Verification FAILED");
            return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
        }

        // Initialize Razorpay to fetch exact details
        const Razorpay = (await import("razorpay")).default;
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "",
            key_secret: razorpaySecret
        });

        // Fetch Real Payment Details
        let realAmount = 0;
        let paymentMethod = 'unknown';
        let paymentEmail = '';
        let paymentContact = '';

        try {
            const payment = await instance.payments.fetch(razorpay_payment_id);

            // SECURITY CHECK: Ensure payment is actually SUCCESSFUL
            if (payment.status !== 'captured' && payment.status !== 'authorized') {
                console.error(`[RAZORPAY_SECURITY] Payment ${razorpay_payment_id} status is '${payment.status}'. REJECTING.`);
                throw new Error(`Payment not successful (Status: ${payment.status})`);
            }

            realAmount = Number(payment.amount); // Store in Paise
            paymentMethod = payment.method as string;
            paymentEmail = payment.email as string;
            paymentContact = payment.contact as string;
            console.log(`[RAZORPAY_FETCH] Amount (INR): ${realAmount}, Method: ${paymentMethod}, Status: ${payment.status}`);
        } catch (e: any) {
            console.error("Failed to verify Razorpay payment status:", e.message);
            return NextResponse.json({ error: "Payment validation failed: " + e.message }, { status: 400 });
        }

        // Payment verified - store in temporary table
        const supabaseAdmin = (await import("@/lib/supabase/admin")).createAdminClient();

        const { error } = await supabaseAdmin.from("payments_temp").insert({
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            whatsapp_number: whatsappNumber,
            amount: realAmount, // Store in Paise
            status: "verified",
        });

        if (error) {
            console.error("[PAYMENT_VERIFY_DB_ERROR]", error);
            // Critical: If we cannot record the payment, we should not proceed.
            return NextResponse.json(
                { error: "Internal Server Error: Failed to record payment verification" },
                { status: 500 }
            );
        } else {
            console.log("[RAZORPAY_VERIFY] Payment stored successfully in payments_temp");

            // CLEANUP: Remove the "Pending" drop-off record for this order
            // So it doesn't show up in Drop-offs tab anymore
            await supabaseAdmin.from("payments_temp")
                .delete()
                .eq("order_id", razorpay_order_id)
                .eq("status", "pending");
        }



        // UPDATE TRANSACTIONS TABLE (Super Admin Features)
        const { data: txnUpdateData } = await supabaseAdmin.from('transactions')
            .update({
                status: 'verified',
                razorpay_payment_id: razorpay_payment_id,
                amount: realAmount, // Store in Paise
                updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', razorpay_order_id)
            .select('id');
            
        const txnUpdateCount = txnUpdateData?.length || 0;

        if (txnUpdateCount === 0) {
            console.log("[RAZORPAY_VERIFY] Transaction not found, inserting new Verified record.");
            await supabaseAdmin.from('transactions').insert({
                status: 'verified',
                razorpay_payment_id: razorpay_payment_id,
                razorpay_order_id: razorpay_order_id,
                whatsapp_number: whatsappNumber || paymentContact,
                student_email: paymentEmail,
                amount: realAmount, // Store in Paise
                source: 'razorpay'
            });
        }

        // Also update user profile with the phone number if authenticated
        // Use regular client to check session
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            console.log("[RAZORPAY_VERIFY] Authenticated user found:", user.id);

            // 1. Update Metadata (Phone)
            if (whatsappNumber) {
                console.log("[RAZORPAY_VERIFY] Updating user metadata with phone:", whatsappNumber);
                const { error: profileError } = await supabase.auth.updateUser({
                    data: { phone: whatsappNumber }
                });
                if (profileError) console.error("[RAZORPAY_VERIFY] Failed to update profile phone:", profileError);
            }

            // 2. Upgrade Membership Tier to 'silver'
            console.log("[RAZORPAY_VERIFY] Upgrading user to SILVER tier...");
            // Use Admin client for DB write (bypass RLS for membership upgrade)
            const { data: profileData, error: upgradeError } = await supabaseAdmin
                .from('profiles')
                .update({
                    membership_tier: 'silver',
                    role: 'student',
                    whatsapp_number: whatsappNumber, // Auto-update WhatsApp Number
                    // phone_number: whatsappNumber // STOPPED: Keep old phone number as per user request
                })
                .eq('id', user.id)
                .select('email') // Select email to use for transaction record
                .single();

            if (upgradeError) {
                console.error("[RAZORPAY_VERIFY] Failed to upgrade membership:", upgradeError);
            } else {
                console.log("[RAZORPAY_VERIFY] User upgraded to SILVER successfully");

                // Link Transaction to User and use PROFILE email
                await supabaseAdmin.from('transactions').update({
                    user_id: user.id,
                    student_email: profileData?.email || user.email, // Prefer Profile Email
                    membership_plan: 'silver'
                }).eq('razorpay_order_id', razorpay_order_id);
            }
        } else {
            console.warn("[RAZORPAY_VERIFY] User is NOT authenticated. Payment recorded but membership NOT upgraded automatically.");
        }

        // --- SYNC TO GOOGLE SHEETS (Action: Verify & Cleanup) ---
        try {
            const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

            if (GOOGLE_SCRIPT_URL) {
                // Fetch transaction details to send accurate data to sheet
                // This is better than relying on local variables which might be incomplete
                const { data: txnData } = await supabaseAdmin
                    .from('transactions')
                    .select('*')
                    .eq('razorpay_order_id', razorpay_order_id)
                    .single();

                // Ensure we have phone number (Fetch from profile if missing in txn)
                let sheetPhone = txnData?.phone_number || "";
                if (!sheetPhone && user) {
                    const { data: p } = await supabaseAdmin.from('profiles').select('phone_number').eq('id', user.id).single();
                    if (p?.phone_number) sheetPhone = p.phone_number;
                }

                // Prepare Payload
                const payload = {
                    action: 'verify', // TELL SCRIPT to MOVE from Drop-offs to Orders
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    email: txnData?.student_email || (user ? user.email : "Guest"),
                    name: txnData?.student_name || (user ? user.user_metadata?.full_name : "Guest"),
                    phone: sheetPhone,
                    whatsapp: txnData?.whatsapp_number || whatsappNumber || "",
                    plan: 'silver',
                    amount: (txnData?.amount || realAmount) / 100, // Convert to Rupees for Sheet
                    status: 'verified',
                    created_at: new Date().toISOString()
                };

                // Send to Sheet (Fire and Forget)
                fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }).catch(err => console.error("[SHEET_SYNC_ERROR]", err));

                console.log("[GOOGLE_SYNC] Verifying Order & Cleaning up Drop-off");
            }
        } catch (sheetErr) {
            console.error("Sheet Sync Logic Error", sheetErr);
        }



        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[RAZORPAY_VERIFY] Error:", error.message);
        return NextResponse.json(
            { error: "Payment verification failed" },
            { status: 500 }
        );
    }
}
