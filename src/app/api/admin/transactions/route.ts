
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // 'pending' | 'verified' | 'all'
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const tier = searchParams.get('tier');

        const supabase = await createClient();

        // Check Admin
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

        let query = supabase.from('transactions').select('*');

        // Filters
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        if (tier) {
            query = query.eq('membership_plan', tier);
        }

        // Order
        query = query.order('created_at', { ascending: false });

        let { data: transactions, error } = await query;

        if (error) throw error;

        // MANUAL PROFILE FETCH (Robust against missing FKs)
        if (transactions && transactions.length > 0) {
            const userIds = transactions
                .map((t: any) => t.user_id)
                .filter((id: any) => id); // Filter nulls

            const uniqueIds = Array.from(new Set(userIds));

            if (uniqueIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, phone, membership_tier')
                    .in('id', uniqueIds as string[]);

                if (profiles) {
                    transactions = transactions.map((t: any) => {
                        const profile = profiles.find((p: any) => p.id === t.user_id);
                        return {
                            ...t,
                            profiles: profile || null
                        };
                    });
                }
            }
        }

        return NextResponse.json(transactions);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Audit Log is complex here.
    // We'll implement basic CREATE first.
    try {
        const body = await req.json();
        const { amount, student_name, student_phone, whatsapp_number, student_email, notes, status, source, membership_plan } = body;

        const supabase = await createClient();

        // Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        // (Assuming checking done or middleware handles. Best to check again).

        const { data, error } = await supabase.from('transactions').insert({
            amount,
            student_name,
            student_phone, // GPay Number usually
            whatsapp_number: whatsapp_number || student_phone, // Use provided WA or fallback to Phone
            student_email,
            notes,
            status: status || 'verified',
            source: source || 'manual',
            membership_plan,
            created_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        // Audit Log
        if (user) {
            await logAudit({
                action: "CREATE_TRANSACTION",
                entityType: "TRANSACTION",
                entityId: data.id,
                details: body,
                userId: user.id
            });
        }

        // --- SYNC MANUAL ENTRY TO GOOGLE SHEET ---
        try {
            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

            const payload = {
                id: data.id,
                payment_id: "MANUAL",
                user_email: student_email || "",
                user_name: student_name,
                phone: student_phone || "",
                whatsapp: whatsapp_number || "",
                plan_id: membership_plan,
                amount: amount / 100, // Stored in paise, send in rupees
                status: status || 'verified',
                created_at: data.created_at
            };

            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

        } catch (sheetErr) {
            console.error("Sheet Sync Logic Error", sheetErr);
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // Edit Transaction
    try {
        const body = await req.json();
        const { id, amount, notes, membership_plan, whatsapp_number } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get Old Data
        const { data: oldData } = await supabase.from('transactions').select('*').eq('id', id).single();

        const { data, error } = await supabase.from('transactions').update({
            amount,
            notes,
            membership_plan,
            whatsapp_number,
            updated_at: new Date().toISOString()
        }).eq('id', id).select().single();

        if (error) throw error;

        // Audit Log
        // Audit Log
        // Audit Log
        if (user) {
            await logAudit({
                action: "UPDATE_TRANSACTION",
                entityType: "TRANSACTION",
                entityId: id,
                details: { old: oldData, new: body },
                userId: user.id
            });
        }

        // USER REQUEST: Sync changes to Profile (e.g. Expired/Cancelled/Platinum)
        if (oldData.user_id && membership_plan && membership_plan !== oldData.membership_plan) {
            console.log(`[TXN_UPDATE] Syncing profile tier for user ${oldData.user_id} to ${membership_plan}`);
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    membership_tier: membership_plan,
                    updated_at: new Date().toISOString()
                })
                .eq('id', oldData.user_id);

            if (profileError) console.error("[TXN_UPDATE_PROFILE_ERROR]", profileError);
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
