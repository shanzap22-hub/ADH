import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const supabaseAdmin = createAdminClient();
        const { data: ledgerData, error } = await supabaseAdmin
            .from("gamification_ledger")
            .select(`
                id,
                user_id,
                action_type,
                points,
                description,
                created_at
            `)
            .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Manual join to bypass schema cache issues
        if (!ledgerData || ledgerData.length === 0) {
            return NextResponse.json([]);
        }

        const userIds = Array.from(new Set(ledgerData.map(log => log.user_id)));
        const { data: profilesData } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);

        const profileMap = new Map();
        if (profilesData) {
            profilesData.forEach(p => {
                profileMap.set(p.id, { full_name: p.full_name, email: p.email });
            });
        }

        const data = ledgerData.map(log => ({
            ...log,
            profiles: profileMap.get(log.user_id) || null
        }));

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
