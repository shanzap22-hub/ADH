import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        console.log("[FINALIZE_ENROLLMENT] === Starting Enrollment Process ===");

        const body = await req.json();
        const { fullName, email, contactNumber, whatsappNumber, paymentId, password } = body;

        console.log("[FINALIZE_ENROLLMENT] Received data:", {
            fullName,
            email,
            hasPaymentId: !!paymentId,
            hasPassword: !!password
        });

        // Validate required fields
        if (!fullName || !email || !contactNumber || !whatsappNumber || !paymentId) {
            console.error("[FINALIZE_ENROLLMENT] Missing required fields");
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Create admin Supabase client with service role
        const supabaseAdmin = createSupabaseClient(
            'https://idlvnncaqmiixwnyleci.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        console.log("[FINALIZE_ENROLLMENT] Admin client created");

        // STEP 1: Check if user already exists by email
        console.log("[FINALIZE_ENROLLMENT] Checking if user exists...");

        const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
            .from("profiles")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();

        if (profileCheckError) {
            console.error("[FINALIZE_ENROLLMENT] Error checking profile:", profileCheckError);
        }

        let userId: string;

        if (existingProfile) {
            // User exists - use existing ID
            console.log("[FINALIZE_ENROLLMENT] User already exists with ID:", existingProfile.id);
            userId = existingProfile.id;

            // Update their profile with WhatsApp number
            const { error: updateError } = await supabaseAdmin
                .from("profiles")
                .update({
                    whatsapp_number: whatsappNumber,
                    membership_tier: "silver",
                })
                .eq("id", userId);

            if (updateError) {
                console.error("[FINALIZE_ENROLLMENT] Profile update error:", updateError);
            }
        } else {
            // User doesn't exist - create new user with admin privileges
            console.log("[FINALIZE_ENROLLMENT] Creating new user account...");

            const userPassword = password || `Temp${Math.random().toString(36).slice(2)}!A1`; // Fallback if no password provided (should not happen with new modal)

            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: email,
                password: userPassword,
                email_confirm: false, // Require email verification
                user_metadata: {
                    full_name: fullName,
                },
            });

            if (createError) {
                // Check if user exists in Auth but not Profile (e.g. failed partial signup/login)
                if (createError.message?.includes("already registered") || createError.status === 422) {
                    console.log("[FINALIZE_ENROLLMENT] User already registered in Auth. Fetching ID to create profile...");

                    // Call the secure RPC function we just created
                    const { data: existingUserId, error: rpcError } = await supabaseAdmin
                        .rpc('get_user_id_by_email', { user_email: email });

                    if (rpcError || !existingUserId) {
                        console.error("[FINALIZE_ENROLLMENT] Failed to recover existing user ID:", rpcError);
                        return NextResponse.json(
                            { error: `User exists but failed to link profile: ${rpcError?.message || 'Unknown RPC error'}` },
                            { status: 500 }
                        );
                    }

                    console.log("[FINALIZE_ENROLLMENT] Recovered User ID:", existingUserId);
                    userId = existingUserId as string;
                } else {
                    console.error("[FINALIZE_ENROLLMENT] Admin createUser Error:", {
                        message: createError.message,
                        status: createError.status,
                    });

                    return NextResponse.json(
                        { error: `Failed to create account: ${createError.message}` },
                        { status: 500 }
                    );
                }
            } else {
                if (!authData.user) {
                    console.error("[FINALIZE_ENROLLMENT] No user data returned from createUser");
                    return NextResponse.json(
                        { error: "Failed to create user account" },
                        { status: 500 }
                    );
                }
                userId = authData.user.id;
                console.log("[FINALIZE_ENROLLMENT] New user created with ID:", userId);
            }

            // Create MINIMAL profile with WhatsApp number only
            // User will fill full details in onboarding form
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .upsert({
                    id: userId,
                    email: email,
                    whatsapp_number: whatsappNumber, // Only WhatsApp number
                    role: "student",
                    membership_tier: "silver",
                    // full_name will be filled in onboarding
                }, { onConflict: "id" });

            if (profileError) {
                console.error("[FINALIZE_ENROLLMENT] Profile creation error:", profileError);
            } else {
                console.log("[FINALIZE_ENROLLMENT] Minimal profile created with WhatsApp number");
            }
        }

        // STEP 2: Get all published courses
        console.log("[FINALIZE_ENROLLMENT] Fetching published courses...");

        const { data: courses, error: coursesError } = await supabaseAdmin
            .from("courses")
            .select("id, title")
            .eq("is_published", true);

        if (coursesError) {
            console.error("[FINALIZE_ENROLLMENT] Courses fetch error:", coursesError);
        }

        console.log("[FINALIZE_ENROLLMENT] Found", courses?.length || 0, "published courses");

        // STEP 3: Enroll user in all courses
        if (courses && courses.length > 0) {
            console.log("[FINALIZE_ENROLLMENT] Creating purchase records...");

            const purchases = courses.map(course => ({
                user_id: userId,
                course_id: course.id,
            }));

            const { error: purchaseError } = await supabaseAdmin
                .from("purchases")
                .upsert(purchases, {
                    onConflict: "user_id,course_id",
                    ignoreDuplicates: true
                });

            if (purchaseError) {
                console.error("[FINALIZE_ENROLLMENT] Purchase error:", purchaseError);
            } else {
                console.log("[FINALIZE_ENROLLMENT] Successfully enrolled in", purchases.length, "courses");
            }
        }

        // STEP 4: Update payment status (instead of deleting) for transaction history
        console.log("[FINALIZE_ENROLLMENT] Updating payment status to completed...");
        await supabaseAdmin
            .from("payments_temp")
            .update({ status: 'completed' })
            .eq("payment_id", paymentId);

        // STEP 5: Create a session for the user to auto-login
        console.log("[FINALIZE_ENROLLMENT] Creating user session...");
        const supabase = await createClient();

        // Sign in with the temporary password would require the password we generated
        // Instead, we'll return success and let the frontend handle redirect

        console.log("[FINALIZE_ENROLLMENT] === Enrollment Complete ===");

        return NextResponse.json({
            success: true,
            userId: userId,
        });

    } catch (error: any) {
        console.error("[FINALIZE_ENROLLMENT] === FATAL ERROR ===");
        console.error("[FINALIZE_ENROLLMENT] Error name:", error.name);
        console.error("[FINALIZE_ENROLLMENT] Error message:", error.message);
        console.error("[FINALIZE_ENROLLMENT] Error stack:", error.stack);

        return NextResponse.json(
            {
                error: "Server error during enrollment",
                details: error.message
            },
            { status: 500 }
        );
    }
}
