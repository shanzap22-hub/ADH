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
        user_metadata: { full_name: fullName }
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

    return NextResponse.json({ success: true });
}
