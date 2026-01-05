import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { email, courseId } = await req.json();

        if (!email || !courseId) {
            return NextResponse.json(
                { error: "Email and course ID are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Find user by email
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        if (profileError || !profile) {
            return NextResponse.json(
                { error: "User not found with that email" },
                { status: 404 }
            );
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", profile.id)
            .eq("course_id", courseId)
            .single();

        if (existing) {
            return NextResponse.json(
                { error: "Student is already enrolled in this course" },
                { status: 400 }
            );
        }

        // Create manual enrollment (bypass payment)
        const { error: enrollError } = await supabase
            .from("purchases")
            .insert({
                user_id: profile.id,
                course_id: courseId,
            });

        if (enrollError) {
            console.error("[MANUAL_ENROLL]", enrollError);
            return NextResponse.json(
                { error: "Failed to enroll student" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[MANUAL_ENROLL]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
