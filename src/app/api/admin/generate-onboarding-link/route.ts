import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Initialize admin client to check role and generate link
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const requestUrl = new URL(req.url);
        const origin = requestUrl.origin;

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${origin}/onboarding/verify-whatsapp`
            }
        });

        if (linkError || !linkData?.properties?.action_link) {
            console.error("Generate Magic Link Error", linkError);
            return NextResponse.json(
                { error: linkError?.message || "Failed to generate onboarding magic link" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            action_link: linkData.properties.action_link
        });
    } catch (error: any) {
        console.error("[GENERATE_ONBOARDING_LINK]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
