import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // 1. Authenticate Requesting User
        const supabaseAuth = await createClient();
        const { data: { user: currentUser } } = await supabaseAuth.auth.getUser();
        if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Initialize admin client to check role
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const origin = new URL(req.url).origin;
        const redirectUrl = `${origin}/onboarding/verify-whatsapp`;

        // 2. Generate Magic Link using Supabase Auth Admin API
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: email.toLowerCase().trim(),
            options: {
                redirectTo: redirectUrl
            }
        });

        if (error || !data || !data.properties || !data.properties.action_link) {
            console.error("[GENERATE_MAGIC_LINK_ERROR]", error);
            return NextResponse.json({ error: error?.message || "Failed to generate magic link" }, { status: 500 });
        }

        const actionUrl = new URL(data.properties.action_link);
        const token = actionUrl.searchParams.get("token");
        const customActionLink = `${origin}/onboarding/verify-whatsapp?token=${token}&email=${encodeURIComponent(email)}`;

        return NextResponse.json({
            success: true,
            action_link: customActionLink
        });

    } catch (e: any) {
        console.error("[GENERATE_MAGIC_LINK_FATAL]", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
