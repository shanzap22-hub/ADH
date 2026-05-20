import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const { linkId, whatsappNumber, fullName, email } = await req.json();

        if (!linkId || !whatsappNumber || !fullName || !email) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ error: "Razorpay credentials missing from server" }, { status: 500 });
        }

        const supabaseAdmin = createAdminClient();

        // Fetch payment link details
        const { data: link, error: linkError } = await supabaseAdmin
            .from("payment_links")
            .select("*")
            .eq("id", linkId)
            .eq("is_active", true)
            .single();

        if (linkError || !link) {
            return NextResponse.json({ error: "Payment link not found or inactive" }, { status: 404 });
        }

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const amountInPaise = Math.round(Number(link.price) * 100);

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `link_rcpt_${Date.now()}`,
            notes: {
                linkId: linkId,
                whatsappNumber: whatsappNumber,
                fullName: fullName,
                email: email,
                type: link.type,
                targetId: link.target_id
            },
        };

        const order = await razorpay.orders.create(options);

        // Store pending payment record in payments_temp
        const { error: tempError } = await supabaseAdmin.from("payments_temp").insert({
            payment_id: `pending_${order.id}`,
            order_id: order.id,
            whatsapp_number: whatsappNumber,
            amount: amountInPaise,
            status: "pending",
        });

        if (tempError) {
            console.error("[LINK_CHECKOUT_TEMP_ERROR]", tempError);
        }

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error: any) {
        console.error("[PAYMENT_LINK_CHECKOUT_ERROR]", error);
        return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 });
    }
}
