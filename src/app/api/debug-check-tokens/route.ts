import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch Instructor by Email
        // Assuming email is shanzap22@gmail.com based on screenshot
        const email = 'shanzap22@gmail.com';

        // Admin List Users to find ID (or ById if known, but email safe)
        // getUserById requires ID. listUsers allows filtering? No.
        // We can't easy filter by email in admin API without listing?
        // Actually, internal queries support it.
        // Or we use `from('profiles').select('*').eq('email', ...)` to get ID first.

        // 1. Get ID from Profiles (Public table, easy)
        const publicSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: profile } = await publicSupabase.from('profiles').select('id').eq('email', email).single();

        if (!profile) return NextResponse.json({ error: "Profile not found" });

        // 2. Get User via Admin
        const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(profile.id);

        if (error || !user) return NextResponse.json({ error: "Auth User not found", details: error });

        // 3. Return Identities (Masked sensitive parts for safety if exposing, but here I need to see if Keys EXIST)
        const googleIdentity = user.identities?.find(i => i.provider === 'google');

        const data = googleIdentity?.identity_data || {};
        const hasRefreshToken = !!data.provider_refresh_token; // || !!data.refresh_token;
        const hasAccessToken = !!data.provider_token; // || !!data.access_token;

        return NextResponse.json({
            email,
            id: user.id,
            googleIdentityFound: !!googleIdentity,
            hasRefreshToken,
            hasAccessToken,
            keys: Object.keys(data), // See what keys exist
            // fullData: data // Uncomment if desperate
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack });
    }
}
