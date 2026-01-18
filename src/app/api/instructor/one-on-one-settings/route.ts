import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();

    // Fetch the latest settings
    // If multiple rows exist (multi-instructor?), we pick the latest or specific one.
    // Assuming single global settings for now as requested.
    const { data, error } = await supabase
        .from('one_on_one_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // 116 = no rows
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || {});
}

export async function POST(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['instructor', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { banner_url, title, features } = body;

    // Upsert directly?
    // We want to update the existing record or create if none.
    // Ideally we should have a Singleton ID or logic.
    // Let's check if one exists.
    const { data: existing } = await supabase
        .from('one_on_one_settings')
        .select('id')
        .limit(1)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('one_on_one_settings')
            .update({
                banner_url,
                title,
                features, // Ensure features is array
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('one_on_one_settings')
            .insert({
                instructor_id: user.id,
                banner_url,
                title,
                features,
                updated_at: new Date().toISOString()
            });
        error = insertError;
    }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
