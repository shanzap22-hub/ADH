import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { studentEmail, courseId } = body;

        if (!studentEmail || !courseId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Get current user (instructor)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify user is an instructor
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!profile || profile.role !== "instructor") {
            return new NextResponse("Only instructors can enroll students", { status: 403 });
        }

        // Verify course belongs to this instructor
        const { data: course, error: courseError } = await supabase
            .from("courses")
            .select("id, instructor_id, title")
            .eq("id", courseId)
            .single();

        if (courseError || !course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        if (course.instructor_id !== user.id) {
            return new NextResponse("You can only enroll students in your own courses", { status: 403 });
        }

        // Find student by email - check in auth.users via profiles
        const { data: studentProfile, error: studentError } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .eq("email", studentEmail.toLowerCase().trim())
            .single();

        // If student not found, return specific error
        if (studentError || !studentProfile) {
            return new NextResponse("Student not found. They must sign up first.", { status: 404 });
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", studentProfile.id)
            .eq("course_id", courseId)
            .maybeSingle();

        if (existingEnrollment) {
            return new NextResponse("Student is already enrolled.", { status: 400 });
        }

        // Create enrollment (purchase record)
        // Use service role or ensure RLS allows instructor to insert
        const { error: enrollError } = await supabase
            .from("purchases")
            .insert({
                user_id: studentProfile.id,
                course_id: courseId,
            });

        if (enrollError) {
            console.error("[ENROLL_ERROR]", enrollError);

            // Check if it's an RLS policy error
            if (enrollError.code === '42501') {
                return new NextResponse("Database permission error. Please contact support.", { status: 500 });
            }

            return new NextResponse(`Failed to enroll student: ${enrollError.message}`, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            student: {
                email: studentProfile.email,
                name: studentProfile.full_name,
            },
            course: {
                title: course.title,
            },
        });
    } catch (error: any) {
        console.error("[INSTRUCTOR_ENROLL]", error);
        return new NextResponse(`Internal Error: ${error.message || 'Unknown error'}`, { status: 500 });
    }
}
