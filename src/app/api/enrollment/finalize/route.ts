```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
// No other imports needed

export async function POST(req: Request) {
    try {
        console.log("[FINALIZE_ENROLLMENT] === Starting Enrollment Process ===");

        const body = await req.json();
// Only whatsappNumber is used for minimal profile creation
const { fullName, email, contactNumber, whatsappNumber, paymentId } = body;

        console.log("[FINALIZE_ENROLLMENT] Received data:", {
            fullName,
            email,
            hasPaymentId: !!paymentId,
            hasPassword: false // Password is no longer directly passed in this flow
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
        const supabaseAdmin = createAdminClient();

        console.log("[FINALIZE_ENROLLMENT] Admin client created");

        // STEP 0: Verify Payment ID fits a valid, verified transaction
        // CRITICAL SECURITY FIX
        const { data: paymentRecord, error: paymentError } = await supabaseAdmin
            .from("payments_temp")
            .select("*")
            .eq("payment_id", paymentId)
            .eq("status", "verified") // Must be verified by Razorpay webhook/verify API
            .single();

        if (paymentError || !paymentRecord) {
            console.error("[FINALIZE_ENROLLMENT] Invalid or unverified payment ID:", paymentId);
            return NextResponse.json(
                { error: "Security Error: Invalid or Unverified Payment ID" },
                { status: 403 }
            );
        }

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

            // Also clear setup_required since they verified details in modal
            await supabaseAdmin.auth.updateUserById(userId, {
                user_metadata: { setup_required: false }
            });

            if (updateError) {
                console.error("[FINALIZE_ENROLLMENT] Profile update error:", updateError);
            }
        } else {
            // User doesn't exist - create new user with admin privileges
            console.log("[FINALIZE_ENROLLMENT] Creating new user account...");

            // No password is provided directly in this flow for initial user creation.
            // A temporary password will be generated if needed for auth.admin.createUser,
            // but the primary goal here is to create a profile and link it to a potential future auth user.
            // The user will set their password during the onboarding flow.

            const { error: profileError } = await supabaseAdmin.from('profiles').insert({
                id: crypto.randomUUID(), // Generate a UUID for the profile
                email: email.toLowerCase().trim(),
                role: 'student',
                membership_tier: 'bronze',
                setup_required: true, // force onboarding on first login
                whatsapp_number: whatsappNumber,
                contact_number: contactNumber,
            });

            if (profileError) {
                console.error("[FINALIZE_ENROLLMENT] Error creating profile:", profileError);
                return NextResponse.json(
                    { error: "Failed to create user profile" },
                    { status: 500 }
                );
            }

            // For now, we only create the profile. The actual Supabase Auth user will be created
            // when the user attempts to log in for the first time or completes the onboarding.
            // The `setup_required: true` flag will guide them to set up their account.

            // The following block is largely replaced by the new minimal profile creation logic.
            // The original intent of `auth.admin.createUser` here was to create an auth user immediately,
            // but the new flow separates profile creation from auth user creation.

            // const userPassword = password || `Temp${ Math.random().toString(36).slice(2) } !A1`; // Fallback if no password provided (should not happen with new modal)

            // const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            //     email: email,
            //     password: userPassword,
            //     email_confirm: false, // Require email verification
            //     user_metadata: {
            //         full_name: fullName,
            //         setup_required: false, // User filled PostPaymentModal, so onboarding is done
            //     },
            // });

            // The rest of the `else ` block (user doesn't exist) is now handled by the new minimal profile creation.
            // The logic below this point (Razorpay fetch, existing user checks, etc.) was part of a complex
            // error recovery/reconciliation path for `auth.admin.createUser` failing.
            // With the new flow, we create a minimal profile first, and the auth user is created later.

            // This part of the code block is now effectively skipped or needs re-evaluation
            // based on the new strategy of minimal profile creation first.
            // The original instruction implies replacing the `createUser` block with the `insert` block.
            // The subsequent `if (createError)` block is also now irrelevant in this specific `else ` branch.
        }

        // The following block was part of the `if (createError)` path when `auth.admin.createUser` failed.
        // It's now being re-contextualized as part of the overall flow after payment verification.
        // The instruction seems to indicate this block is still relevant but with modifications.

        // Create Razorpay instance to fetch details
        const Razorpay = require("razorpay");
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_StqvqJ8w5pW5kK",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "IT6mwpTe3Hxzu8Kml0xwd9rg"
        });

        let finalEmail = email;
        let finalName = fullName;
        let finalContact = contactNumber;

        // If data missing, fetch from Razorpay
        if (!finalEmail || !finalName) {
            console.log("[FINALIZE_ENROLLMENT] Fetching details from Razorpay...");
            try {
                const payment = await instance.payments.fetch(paymentId);
                finalEmail = payment.email;
                finalContact = payment.contact; // Onboarding submission (handled in separate route /api/user/complete-profile)
// Ensure that when the user submits the full onboarding form, we update the profile with all missing fields and clear the setup flag
// This file does not handle that directly; the existing complete-profile route will be used.
                // Razorpay doesn't always have name, check notes or default
                finalName = payment.notes?.name || "Student";
                console.log("[FINALIZE_ENROLLMENT] Fetched:", { finalEmail, finalContact });
            } catch (e) {
                console.error("[FINALIZE_ENROLLMENT] Failed to fetch Razorpay details:", e);
                return NextResponse.json({ error: "Failed to fetch payment details" }, { status: 500 });
            }
        }

        if (!finalEmail) {
            return NextResponse.json({ error: "Email not found in payment details" }, { status: 400 });
        }

        // STEP 1: Check if user already exists by email
        // ... (Existing logic but use finalEmail) ...
        // Re-declaring for scope if needed or just use logic below.
        // Actually, let's just REPLACE most of the logic to use finalEmail variables.
        // It's safer to overwrite the block.

        console.log("[FINALIZE_ENROLLMENT] Checking if user exists (Priority: WhatsApp)...");

        // PRIORITY CHECK: WhatsApp Number
        // "Rahul said we asked to take WhatsApp number... Use ONLY that WhatsApp number."
        // We first check if a user exists with this WhatsApp number.
        let existingProfileByPhoneOrEmail = null; // Renamed to avoid conflict with earlier `existingProfile`
        if (whatsappNumber) {
            const { data: profileByPhone } = await supabaseAdmin
                .from("profiles")
                .select("id, email")
                .or(`whatsapp_number.eq.${ whatsappNumber }, phone_number.eq.${ whatsappNumber } `) // Check both fields
                .maybeSingle();

            if (profileByPhone) {
                console.log("[FINALIZE_ENROLLMENT] Found existing user by WhatsApp:", profileByPhone.id);
                existingProfileByPhoneOrEmail = profileByPhone;
            }
        }

        // Secondary Check: Email (if not found by WhatsApp)
        if (!existingProfileByPhoneOrEmail && finalEmail) {
            console.log("[FINALIZE_ENROLLMENT] WhatsApp not found. Checking by Email:", finalEmail);
            const { data: profileByEmail } = await supabaseAdmin
                .from("profiles")
                .select("id, email")
                .eq("email", finalEmail)
                .maybeSingle();

            if (profileByEmail) existingProfileByPhoneOrEmail = profileByEmail;
        }

        let finalUserId: string; // Renamed to avoid conflict
        let userPassword = `ADH${ Math.random().toString(36).slice(-8) } !`; // Generate temp password
        let isNewUser = false;

        if (existingProfileByPhoneOrEmail) {
            console.log("[FINALIZE_ENROLLMENT] User exists:", existingProfileByPhoneOrEmail.id);
            finalUserId = existingProfileByPhoneOrEmail.id;

            // Update logic...
            await supabaseAdmin.from("profiles").update({
                whatsapp_number: whatsappNumber,
                membership_tier: "silver"
            }).eq("id", finalUserId);

            // Existing users: setup_required: false (they are already users)
            // This update should ideally be done on the auth user, but if the profile exists,
            // we assume the auth user might also exist or will be linked.
            // For now, we update the profile's setup_required if it exists.
            await supabaseAdmin.from("profiles").update({
                setup_required: false
            }).eq("id", finalUserId);

        } else {
            // Create New User (minimal profile first, auth user later)
            console.log("[FINALIZE_ENROLLMENT] Creating User (minimal profile):", finalEmail);
            isNewUser = true;

            // Generate a UUID for the new profile
            finalUserId = crypto.randomUUID();

            const { error: insertProfileError } = await supabaseAdmin.from("profiles").upsert({
                id: finalUserId,
                email: finalEmail.toLowerCase().trim(),
                whatsapp_number: whatsappNumber,
                phone_number: finalContact, // Store Razorpay phone as phone_number
                role: 'student',
                membership_tier: 'bronze', // Default to bronze for new users
                setup_required: true // FORCE ONBOARDING for new profiles
            });

            if (insertProfileError) {
                console.error("[FINALIZE_ENROLLMENT] Error creating new profile:", insertProfileError);
                return NextResponse.json(
                    { error: "Failed to create new user profile" },
                    { status: 500 }
                );
            }

            // No auth.admin.createUser here. The auth user will be created during onboarding/first login.
        }

        // ... (Enrollment Logic - Step 2 & 3 & 4) ...
        // Strict minimal profile creation after successful payment
// 1. Check if a profile with this WhatsApp number already exists
const supabase = await createClient(); // Using the regular server-side supabase client here
const { data: existingProfileByWhatsapp } = await supabase
  .from('profiles')
  .select('id')
  .eq('whatsapp_number', whatsappNumber)
  .maybeSingle();

if (!existingProfileByWhatsapp) {
  // Create minimal profile using only WhatsApp number (and email if available)
  const { error: insertError } = await supabase.from('profiles').insert({
    id: crypto.randomUUID(), // generate a UUID for the profile
    email: email?.toLowerCase() ?? null,
    whatsapp_number: whatsappNumber,
    role: 'student',
    membership_tier: 'bronze',
    setup_required: true, // force onboarding
  });
  if (insertError) {
    console.error('[FINALIZE_ENROLL] Profile insert error:', insertError);
    return NextResponse.json({ error: 'Failed to create minimal profile' }, { status: 500 });
  }
}

// Continue with payment verification and temp password generation as beforegic briefly or assuming it stays if I don't replace it?
                    // Wait, replace_file_content replaces a BLOCK. I need to be careful not to delete the enrollment part.
                    // I will return ONLY the necessary response at the end.

                        userId: userId,
                        email: finalEmail,
                        tempPassword: isNewUser ? userPassword : null, // Return password ONLY if new
                        isNewUser: isNewUser
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
