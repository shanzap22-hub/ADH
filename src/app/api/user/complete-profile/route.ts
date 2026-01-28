// src/app/api/user/complete-profile/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type Payload = {
    fullName: string;
    email: string;
    contactNumber: string;
    whatsappNumber: string;
    password: string; // "SKIPPED" if unchanged
};

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const payload: Payload = await request.json();
    const { fullName, email, contactNumber, whatsappNumber, password } = payload;

    // Update profile table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            email,
            phone_number: contactNumber,
            whatsapp_number: whatsappNumber,
            setup_required: false,
        })
        .eq('id', user.id);

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // ADMIN AUTH UPDATE: Force update email and metadata
    // We use service role to bypass email confirmation requirement so user isn't locked out
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: adminError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: email,
        email_confirm: true, // Auto-confirm the new email
        user_metadata: {
            full_name: fullName,
            setup_required: false // CRITICAL FIX: Update metadata to exit middleware loop
        }
    });

    if (adminError) {
        console.error('Admin Auth Update Failed:', adminError);
        return NextResponse.json({ error: "Failed to update login email. Please try again or contact support." }, { status: 500 });
    }

    // Update password if a new one was provided
    if (password && password !== 'SKIPPED') {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) {
            return NextResponse.json({ error: pwError.message }, { status: 500 });
        }
    }

    // --- CRITICAL AUTO-LINK: MERGE GUEST TRANSACTIONS ---
    // Problem: Guest checkout creates a transaction with temp email and NULL user_id.
    // Fix: Find those orphaned transactions using phone/whatsapp and LINK them to this user.
    try {
        // Find transactions with matching phone/whatsapp AND (user_id is NULL OR email contains 'adh.pending')
        const { data: orphans, error: orphanError } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .or(`whatsapp_number.eq.${whatsappNumber},phone_number.eq.${contactNumber}`)
            .is('user_id', null);

        if (orphans && orphans.length > 0) {
            console.log(`[AUTO-LINK] Found ${orphans.length} orphaned transactions for ${fullName}. Linking now...`);

            const orphanIds = orphans.map((t: any) => t.id);

            // Update them all
            const { error: linkError } = await supabaseAdmin
                .from('transactions')
                .update({
                    user_id: user.id,
                    student_email: email,       // Updates the temp email to REAL email
                    student_name: fullName,
                    phone_number: contactNumber,
                    whatsapp_number: whatsappNumber,
                    updated_at: new Date().toISOString()
                })
                .in('id', orphanIds);

            if (linkError) console.error("[AUTO-LINK] Failed to link transactions:", linkError);
            else console.log("[AUTO-LINK] Successfully linked transactions.");
        }
    } catch (linkErr) {
        console.error("[AUTO-LINK] Exception during linking:", linkErr);
    }

    // --- SEND RECEIPT EMAIL (New) ---
    try {
        // Fetch the latest verified transaction for this user
        const { data: transaction } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'verified')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (transaction) {
            const { sendPaymentReceipt } = await import('@/lib/mail');
            await sendPaymentReceipt(
                email,
                fullName,
                transaction.amount,
                transaction.created_at,
                transaction.razorpay_payment_id || transaction.id, // Fallback to internal ID if razorpay ID missing
                transaction.coupon_code
            );
            console.log("DEBUG: Receipt matched and sent for user:", user.id);
        } else {
            console.log("DEBUG: No verified transaction found for receipt sending. User:", user.id);
        }
    } catch (mailError) {
        console.error("DEBUG: Failed to send receipt email:", mailError);
        // Do not block the response, just log error
    }

    return NextResponse.json({ success: true });
}
