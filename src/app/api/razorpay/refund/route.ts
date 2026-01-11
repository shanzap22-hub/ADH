import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Security Check: Only Super Admin can refund
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
        }

        const { paymentId } = await req.json();

        if (!paymentId) {
            return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
        }

        // Call Razorpay Refund API
        // by default refunds full amount if amount not specified
        const refund = await razorpay.payments.refund(paymentId, {
            speed: 'normal',
        });

        console.log("[RAZORPAY_REFUND_SUCCESS]", refund);

        // Update local database status
        // We assume payments_temp is where we store this
        await supabase
            .from("payments_temp")
            .update({ status: 'refunded' })
            .eq("payment_id", paymentId);

        return NextResponse.json({ success: true, refund });

    } catch (error: any) {
        console.error("[RAZORPAY_REFUND_ERROR]", error);
        return NextResponse.json(
            { error: error.error?.description || "Refund failed" },
            { status: 500 }
        );
    }
}
