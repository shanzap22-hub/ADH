import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch all tier pricing
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if super admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Fetch all tier pricing
        const { data: tiers, error } = await supabase
            .from("tier_pricing")
            .select("*")
            .order("price", { ascending: true });

        if (error) {
            console.error("[tier-pricing] Fetch error:", error);
            return new NextResponse("Database error", { status: 500 });
        }

        return NextResponse.json(tiers);
    } catch (error) {
        console.error("[tier-pricing] GET exception:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PATCH: Update tier pricing
export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if super admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { tiers } = body;

        if (!Array.isArray(tiers)) {
            return new NextResponse("Invalid request body", { status: 400 });
        }

        // Use service role for updates
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Update each tier
        for (const tier of tiers) {
            const { error } = await supabaseAdmin
                .from("tier_pricing")
                .update({
                    price: tier.price,
                    max_courses: tier.max_courses,
                    has_booking_access: tier.has_booking_access,
                    is_active: tier.is_active,
                    description: tier.description,
                    updated_at: new Date().toISOString(),
                })
                .eq("tier", tier.tier);

            if (error) {
                console.error(`[tier-pricing] Update error for ${tier.tier}:`, error);
                return new NextResponse(`Failed to update ${tier.tier}`, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[tier-pricing] PATCH exception:", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
