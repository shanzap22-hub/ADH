import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const body = await req.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {

            // Payment valid, enroll user
            const { error } = await supabase
                .from("purchases")
                .insert([{
                    user_id: user.id,
                    course_id: courseId,
                    // store payment info if needed, e.g. payment_id
                }]);

            if (error) {
                console.error("Enrollment Error", error);
                return new NextResponse("Error enrolling user", { status: 500 });
            }

            return NextResponse.json({ success: true });
        } else {
            return new NextResponse("Invalid signature", { status: 400 });
        }

    } catch (error) {
        console.log("[PAYMENT_VERIFY]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
