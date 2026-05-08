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

            const userId = currentUser?.id || null;
            const userEmail = currentUser?.email || null;
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

            // Initialize Admin Client for DB operations (Bypass RLS)
            const { createClient: createSupClient } = await import('@supabase/supabase-js');
            const sbAdmin = createSupClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            // Insert into payments_temp for Drop-offs
            const { error: dbError } = await sbAdmin.from('payments_temp').insert({
                order_id: order.id,
                payment_id: "PENDING_" + order.id, // Make it UNIQUE using order ID
                amount: order.amount,
                whatsapp_number: whatsappNumber,
                status: 'pending'
                // Note: payments_temp schema provided didn't show user_id/name/email columns
                // If they exist, add them here. For now, sticking to what I know.
            });

            if (dbError) console.error("DB Log Error", dbError);

            // --- SYNC DROP-OFF/INITIATED TO GOOGLE SHEET ---
            // --- SYNC DROP-OFF/INITIATED TO GOOGLE SHEET ---
            // --- SYNC DROP-OFF/INITIATED TO GOOGLE SHEET ---
            try {
                const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

                if (GOOGLE_SCRIPT_URL) {
                    const payload = {
                        action: 'initiate',
                        order_id: order.id,
                        email: userEmail || "Guest",
                        name: userName || "Guest",
                        phone: userPhone || "",
                        whatsapp: whatsappNumber || "",
                        plan: "silver", // Default plan
                        amount: finalAmount,
                        status: 'initiated',
                        created_at: new Date().toISOString()
                    };

                    // Send to Sheet
                    await fetch(GOOGLE_SCRIPT_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    console.log("[GOOGLE_SYNC] Synced Drop-off initiated");
                }
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
