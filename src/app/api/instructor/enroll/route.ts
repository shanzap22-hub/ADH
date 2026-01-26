import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

        // Use Admin Client for user creation/enrollment
        const supabaseAdmin = createAdminClient();

        // Find student by email - check in auth.users via profiles
        const { data: studentWrapper, error: studentErrorCheck } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name")
            .eq("email", studentEmail.toLowerCase().trim())
            .maybeSingle();

        let studentId = studentWrapper?.id;
        let finalStudentName = studentWrapper?.full_name;

        // If student not found, create them!
        if (!studentId) {
            console.log(`[INSTRUCTOR_ENROLL] Student not found: ${studentEmail}. Creating new account...`);

            // 1. Create Auth User
            const tempPassword = `ADH${Math.random().toString(36).slice(-6)}!`;
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: studentEmail.toLowerCase().trim(),
                password: tempPassword,
                email_confirm: true, // Auto confirm since instructor added
                user_metadata: { role: 'student' }
            });

            if (createError) {
                // Check if user exists in Auth but not Profile (edge case)
                if (createError.message.includes("already registered")) {
                    console.log("User exists in Auth but no profile. Error condition.");
                    return new NextResponse("User exists but has no profile. Please ask admin to fix.", { status: 500 });
                }
                return new NextResponse(`Failed to create student account: ${createError.message}`, { status: 500 });
            }

            studentId = authData.user.id;

            // 2. Create Minimal Profile
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .insert({
                    id: studentId,
                    email: studentEmail.toLowerCase().trim(),
                    role: 'student',
                    membership_tier: 'bronze',
                });

            if (profileError) {
                return new NextResponse(`Failed to create student profile: ${profileError.message}`, { status: 500 });
            }
            console.log(`[INSTRUCTOR_ENROLL] Created new student: ${studentId}`);
        } else {
            console.log(`[INSTRUCTOR_ENROLL] Found existing student: ${studentId}`);
        }

        // Check if already enrolled
        const { data: existingEnrollment } = await supabaseAdmin
            .from("purchases")
            .select("id")
            .eq("user_id", studentId)
            .eq("course_id", courseId)
            .maybeSingle();

        if (existingEnrollment) {
            return new NextResponse("Student is already enrolled.", { status: 400 });
        }

        // Create enrollment (purchase record)
        // Use Admin client to ensure permission
        const { error: enrollError } = await supabaseAdmin
            .from("purchases")
            .insert({
                user_id: studentId,
                course_id: courseId,
            });

        if (enrollError) {
            console.error("[ENROLL_ERROR]", enrollError);
            return new NextResponse(`Failed to enroll student: ${enrollError.message}`, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            student: {
                email: studentEmail,
                name: finalStudentName || "New Student",
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
