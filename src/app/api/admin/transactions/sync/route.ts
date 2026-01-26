import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Get all profiles with membership
        const { data: profiles, error: pError } = await supabase
            .from('profiles')
            .select('*')
            .not('membership_tier', 'is', null) // Only those with a tier
            .neq('membership_tier', 'free');

        if (pError) throw pError;

        // 2b. FIX EXISTING LEGACY AMOUNTS (User Request: Set to 0, don't approximate)
        // This ensures if user already synced, we correct it.
        const { error: fixError } = await supabase
            .from('transactions')
            .update({ amount: 0 })
            .eq('source', 'legacy_import')
            .gt('amount', 0); // Only if they were set to > 0

        if (fixError) console.error("Fix Legacy Error:", fixError);

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ message: "No profiles found to sync", count: 0 });
        }

        // 2. Get existing transaction user_ids
        const { data: existing, error: tError } = await supabase
            .from('transactions')
            .select('user_id');

        if (tError) throw tError;

        const existingIds = new Set(existing?.map(t => t.user_id));

        // 3. Prepare inserts
        const toInsert = profiles
            .filter(p => !existingIds.has(p.id))
            .map(p => {
                const amount = 0;
                return {
                    user_id: p.id,
                    student_name: p.full_name,
                    student_email: p.email,
                    whatsapp_number: p.whatsapp_number || p.phone_number,
                    status: 'verified',
                    amount: amount,
                    currency: 'INR',
                    source: 'legacy_import',
                    membership_plan: p.membership_tier,
                    created_at: p.created_at || new Date().toISOString()
                };
            });

        if (toInsert.length === 0) {
            // Even if no NEW inserts, we might have fixed legacy.
            return NextResponse.json({ message: "Data synchronized (Legacy amounts fixed)", count: 0 });
        }

        // 4. Insert
        const { error: insError } = await supabase.from('transactions').insert(toInsert);
        if (insError) throw insError;

        return NextResponse.json({ message: "Success", count: toInsert.length });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
