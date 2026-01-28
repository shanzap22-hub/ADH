import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        console.log("[RAZORPAY_CREATE_ORDER] Starting order creation...");

        const { whatsappNumber, couponCode } = await req.json();
        console.log("[RAZORPAY_CREATE_ORDER] Request:", { whatsappNumber, couponCode });

        if (!whatsappNumber) {
            return NextResponse.json({ error: "WhatsApp number is required" }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ error: "Razorpay credentials missing" }, { status: 500 });
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // 1. Calculate Amount
        let finalAmount = 4999; // Base Price
        let discountAmount = 0;
        let appliedCoupon = null;

        if (couponCode) {
            // Validate Coupon (Server Side)
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data: coupon, error } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .ilike('code', couponCode)
                .single();

            if (coupon && coupon.active) {
                // Check Expiry
                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                // Check Limit
                const isLimitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;

                if (!isExpired && !isLimitReached) {
                    if (coupon.discount_type === 'percentage') {
                        discountAmount = (finalAmount * Number(coupon.discount_value)) / 100;
                    } else {
                        discountAmount = Number(coupon.discount_value);
                    }
                    if (discountAmount > finalAmount) discountAmount = finalAmount;

                    finalAmount = finalAmount - discountAmount;
                    appliedCoupon = coupon;
                }
            }
        }

        // Safety check for negative amount
        if (finalAmount < 0) finalAmount = 0;

        const AMOUNT_IN_PAISE = Math.round(finalAmount * 100);

        const options = {
            amount: AMOUNT_IN_PAISE,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                whatsappNumber: whatsappNumber,
                couponCode: appliedCoupon ? appliedCoupon.code : "",
            },
        };

        console.log("[RAZORPAY_CREATE_ORDER] Creating order with amount:", AMOUNT_IN_PAISE);

        const order = await razorpay.orders.create(options);

        // TRACKING DROP-OFFS
        try {
            const { createClient } = await import('@/lib/supabase/server');
            const supabase = await createClient();

            // Try to get user info if logged in
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            let userId = currentUser?.id || null;
            let userEmail = currentUser?.email || null;
            let userName = currentUser?.user_metadata?.full_name || null;
            let userPhone = currentUser?.phone || null;

            // If user is logged in, fetch profile for more details (like stored phone number)
            if (userId) {
                const { data: profile } = await supabase.from('profiles').select('full_name, phone_number, whatsapp_number').eq('id', userId).single();
                if (profile) {
                    if (!userName) userName = profile.full_name;
                    if (!userPhone) userPhone = profile.phone_number;
                    // Prefer profile whatsapp if available, else use input
                    // Actually input is freshest, so keep input whatsappNumber as primary for this txn
                }
            }

            const { error: dbError } = await supabase.from('transactions').insert({
                razorpay_order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                whatsapp_number: whatsappNumber,
                phone_number: userPhone, // Capture phone number
                user_id: userId,        // Capture user ID
                student_email: userEmail, // Capture email
                student_name: userName,   // Capture name
                status: 'pending',
                source: 'razorpay',
                coupon_code: appliedCoupon ? appliedCoupon.code : null,
                original_amount: 499900,
                discount_amount: Math.round(discountAmount * 100)
            });

            if (dbError) console.error("DB Log Error", dbError);

            // --- SYNC DROP-OFF/INITIATED TO GOOGLE SHEET ---
            try {
                const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

                // User info already fetched above

                const payload = {
                    id: order.id,
                    payment_id: "PENDING",
                    user_email: userEmail || "",
                    user_name: userName || "Guest",
                    phone: userPhone || "",
                    whatsapp: whatsappNumber || "",
                    plan_id: 'silver',
                    amount: finalAmount, // Amount in Rupees
                    status: 'initiated', // This marks it as a potential drop-off
                    created_at: new Date().toISOString()
                };

                // Wait for the sync to complete to ensure Vercel doesn't kill the process
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                console.log("[GOOGLE_SYNC] Synced Drop-off initiated");

            } catch (sheetErr) {
                console.error("Sheet Sync Logic Error", sheetErr);
            }

        } catch (dbEx) {
            console.error("DB Tracking Skipped", dbEx);
        }

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
            discountAmount: discountAmount
        });

    } catch (error: any) {
        console.error("[RAZORPAY_CREATE_ORDER] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
