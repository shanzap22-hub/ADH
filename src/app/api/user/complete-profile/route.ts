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

    // Update auth metadata (full_name & email) if needed
    const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
        email,
    });
    if (metaError) {
        // Non‑fatal – profile already updated
        console.warn('Auth metadata update failed:', metaError.message);
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
