import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const supabase = await createClient();

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if already enrolled
        const { data: existingPurchase } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .maybeSingle();

        if (existingPurchase) {
            return new NextResponse("Already enrolled", { status: 400 });
        }

        // Create free enrollment
        const { error: enrollError } = await supabase
            .from("purchases")
            .insert({
                user_id: user.id,
                course_id: courseId,
            });

        if (enrollError) {
            console.error("[FREE_ENROLL]", enrollError);
            return new NextResponse("Failed to enroll", { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FREE_ENROLL]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
