import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ valid: false, message: "Code required" });
        }

        const supabase = await createClient(); // Anon client is fine if RLS allows active=true read? 
        // No, I disabled public read policy. I need Service Role or Admin to check?
        // Actually, for Validation, the public USER needs to check.
        // So I need a Service Role client to bypass RLS for validation, 
        // OR a specific RPC.
        // Using Service Role here is safe as we only return sanitized result (valid/discount), not sensitive data.

        // Wait, 'createClient' uses user session. User is not logged in!
        // So 'createClient' (server) has no permissions if RLS blocks anon.
        // I need to use Service Role Key to fetch coupon.
        // NOTE: createClient from @/lib/supabase/server uses cookie.
        // I'll use separate logic or enable public read for coupons?
        // Enabling public read allows scraping. Not good.
        // I'll use Service Role Client.

        // Simulating Service Role logic or using standard client if user logs in? 
        // User is NOT logged in (Join Flow).
        // So I MUST use Service Role.

        // WARNING: I don't have direct access to createAdminClient in this file context?
        // I need to import `createClient` from `@supabase/supabase-js` manually with env vars.

        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: coupon, error } = await supabaseAdmin
            .from('coupons')
            .select('*')
            .ilike('code', code) // Case-insensitive match
            .single();

        if (error || !coupon) {
            return NextResponse.json({ valid: false, message: "Invalid Coupon Code" });
        }

        if (!coupon.active) {
            return NextResponse.json({ valid: false, message: "This coupon is inactive" });
        }

        // Check Expiry
        if (coupon.expires_at) {
            const now = new Date();
            const expires = new Date(coupon.expires_at);
            if (now > expires) {
                return NextResponse.json({ valid: false, message: "Coupon has expired" });
            }
        }

        // Check Usage Limit
        if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
            return NextResponse.json({ valid: false, message: "Coupon usage limit reached" });
        }

        // Calculate Discount
        // Base Price is ₹4,999
        const ORIGINAL_PRICE = 4999;
        let discountAmount = 0;

        if (coupon.discount_type === 'percentage') {
            discountAmount = (ORIGINAL_PRICE * Number(coupon.discount_value)) / 100;
        } else {
            discountAmount = Number(coupon.discount_value);
        }

        // Cap discount
        if (discountAmount > ORIGINAL_PRICE) discountAmount = ORIGINAL_PRICE;

        // Round to 2 decimals
        discountAmount = Math.round(discountAmount * 100) / 100;

        return NextResponse.json({
            valid: true,
            code: coupon.code,
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value,
            calculatedDiscount: discountAmount,
            finalPrice: ORIGINAL_PRICE - discountAmount,
            message: "Coupon Applied!"
        });

    } catch (error: any) {
        console.error("Coupon Validate Error:", error);
        return NextResponse.json({ valid: false, message: "Server Error" }, { status: 500 });
    }
}
