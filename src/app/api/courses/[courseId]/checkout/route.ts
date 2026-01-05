import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "",
        });

        const { courseId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { data: course } = await supabase
            .from("courses")
            .select("price, title")
            .eq("id", courseId)
            .single();

        if (!course) {
            return new NextResponse("Not found", { status: 404 });
        }

        if (!course.price) {
            return new NextResponse("Course is free", { status: 400 });
        }

        const amount = Math.round(course.price * 100); // Razorpay expects amount in paisa (sub-unit)

        const options = {
            amount: amount,
            currency: "USD", // Changing to INR if testing with Indian keys, but keeping USD per user context? 
            // Razorpay primarily supports INR but can support international. 
            // Let's stick to user's likely context. If USD, ensure Razorpay account supports it.
            // For safety/default, I will use "USD" as the code had USD before.
            receipt: courseId,
            notes: {
                courseId: courseId,
                userId: user.id,
            }
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);

    } catch (error) {
        console.log("[COURSE_ID_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
