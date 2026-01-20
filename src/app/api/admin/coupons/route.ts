import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        // Verify Auth/Role is handled by RLS, but explicit check is safer
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: coupons, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(coupons);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { code, discount_type, discount_value, usage_limit, expires_at } = body;

        const { data, error } = await supabase.from('coupons').insert({
            code: code.toUpperCase(),
            discount_type,
            discount_value,
            usage_limit: usage_limit ? parseInt(usage_limit) : null,
            expires_at: expires_at || null,
            active: true
        }).select().single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Create Coupon Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { id, active } = body; // Only supporting Active Toggle for now

        const { error } = await supabase
            .from('coupons')
            .update({ active })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const supabase = await createClient();
        const { error } = await supabase.from('coupons').delete().eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
