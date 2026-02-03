import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNotificationSettings } from "@/lib/notifications";

export async function GET(req: Request) {
    try {
        const settings = await getNotificationSettings();
        return NextResponse.json(settings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (!['admin', 'super_admin'].includes(profile?.role || '')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();

        // Update DB
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'notification_config',
                value: body,
                updated_at: new Date().toISOString(),
                updated_by: user.id
            });

        if (error) throw error;

        return NextResponse.json({ success: true, settings: body });

    } catch (error: any) {
        console.error("Config Update Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
