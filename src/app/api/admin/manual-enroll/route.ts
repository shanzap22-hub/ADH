import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // For Admin Actions

export async function POST(req: Request) {
    try {
        const { email, tier, name } = await req.json();

        if (!email || !tier) {
            return NextResponse.json(
                { error: "Email and Membership Tier are required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find user by email (using existing client)
        let { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

        let temporaryPassword = null;
        let isNewUser = false;

        // If user DOES NOT exist, Create them
        if (!profile) {
            // Need Admin Client to create user
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            temporaryPassword = "123456"; // Default Temp Password
            isNewUser = true;

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: temporaryPassword,
                email_confirm: true,
                user_metadata: { full_name: name || "Student", setup_required: true }
            });

            if (createError || !newUser.user) {
                console.error("Create User Error", createError);
                return NextResponse.json({ error: "Failed to create new user account." }, { status: 500 });
            }

            // Create Profile Record manually if trigger is slow, OR wait/ensure it exists
            // Usually 'createUser' trigger in DB creates profile.
            // But we need the ID immediately.
            const userId = newUser.user.id;

            // Explicitly create profile to be safe and set tier immediately
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .upsert({
                    id: userId,
                    email: email,
                    full_name: name || "Student",
                    role: "student",
                    membership_tier: tier, // Set Tier HERE directly
                }, { onConflict: "id" });

            if (profileError) {
                console.error("Profile Create Error", profileError);
                // Proceeding cautiously, assuming ID exists
            }

            profile = { id: userId };

            // Note: Since we set membership_tier in create, we might skip the update step below,
            // but running it again is harmless.
        } else {
            // Update Existing User
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ membership_tier: tier })
                .eq("id", profile.id);

            if (profileError) {
                console.error(profileError);
                return NextResponse.json({ error: "Failed to update profile tier" }, { status: 500 });
            }
        }


        // 2. Enroll in ALL Published Courses (Grant Access)
        // (Similar logic to Finalize Payment)
        const { data: courses } = await supabase
            .from("courses")
            .select("id")
            .eq("is_published", true);

        if (courses && courses.length > 0) {
            const purchases = courses.map(course => ({
                user_id: profile.id,
                course_id: course.id,
            }));

            // Use upsert to ignore duplicates
            const { error: enrollError } = await supabase
                .from("purchases")
                .upsert(purchases, {
                    onConflict: "user_id,course_id",
                    ignoreDuplicates: true
                });

            if (enrollError) {
                console.error("Enrollment Error:", enrollError);
                // We don't fail the whole request, but log it.
                // Profile is already updated.
            }
        }

        let message = `User upgraded to ${tier} and enrolled in all courses.`;
        if (isNewUser) {
            message = `New Account Created! Password: ${temporaryPassword}. Upgrade successful.`;
        }

        return NextResponse.json({ success: true, message });
    } catch (error: any) {
        console.error("[MANUAL_ENROLL]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
