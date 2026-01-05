import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        console.log("[RAZORPAY_CREATE_ORDER] Starting order creation...");

        const { whatsappNumber } = await req.json();
        console.log("[RAZORPAY_CREATE_ORDER] WhatsApp number:", whatsappNumber);

        if (!whatsappNumber) {
            console.error("[RAZORPAY_CREATE_ORDER] Missing WhatsApp number");
            return NextResponse.json(
                { error: "WhatsApp number is required" },
                { status: 400 }
            );
        }

        // Check if Razorpay credentials are set
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("[RAZORPAY_CREATE_ORDER] Missing Razorpay credentials");
            return NextResponse.json(
                { error: "Razorpay credentials not configured" },
                { status: 500 }
            );
        }

        console.log("[RAZORPAY_CREATE_ORDER] Razorpay Key ID:", process.env.RAZORPAY_KEY_ID?.substring(0, 10) + "...");

        // Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Create Razorpay order - ₹4999 (amount in paise)
        const AMOUNT_IN_PAISE = 499900; // ₹4999

        const options = {
            amount: AMOUNT_IN_PAISE,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                whatsappNumber: whatsappNumber,
            },
        };

        console.log("[RAZORPAY_CREATE_ORDER] Creating order with options:", options);

        const order = await razorpay.orders.create(options);

        console.log("[RAZORPAY_CREATE_ORDER] Order created successfully:", order.id);

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });
    } catch (error: any) {
        console.error("[RAZORPAY_CREATE_ORDER] Error details:", {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error,
            stack: error.stack
        });

        return NextResponse.json(
            { error: error.message || "Failed to create order" },
            { status: 500 }
        );
    }
}
