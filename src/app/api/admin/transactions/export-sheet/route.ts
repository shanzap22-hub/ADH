
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60; // Extend Vercel timeout to 60s

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // 1. Check Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch UNSYNCED Transactions Only
        // Sort by created_at ascending so we insert old->new
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, profiles(full_name, phone_number, email)')
            .eq('is_synced_to_sheet', false) // Only unsynced
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!transactions || transactions.length === 0) return NextResponse.json({ count: 0, total: 0, message: "No new records to sync" });

        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

        let successCount = 0;
        const syncedIds: string[] = [];

        // 3. Serial Sync to avoid Race Conditions/Rate Limits
        for (const txn of transactions) {
            try {
                // Determine Name/Email
                // Determine Name/Email - Prioritize Profile (Real Data) over Transaction (Snapshot/Stale)
                let name = txn.profiles?.full_name || txn.student_name || "Unknown";
                let email = txn.profiles?.email || txn.student_email || "";

                // Fallback for legacy data
                if (!email && txn.student_email) email = txn.student_email;

                // Get Phone & WhatsApp
                // Phone: From Profile (User Preference/Correct)
                // WhatsApp: From Transaction (Payment Input)
                const phone = txn.profiles?.phone_number || txn.phone_number || "";
                const whatsapp = txn.whatsapp_number || "";

                const payload = {
                    action: 'verify',
                    order_id: txn.razorpay_order_id, // Map standard Order ID for matching Key
                    payment_id: txn.razorpay_payment_id || "MANUAL",
                    email: email, // Script expects 'email' or 'user_email' (mapped correctly in script logic?) No, script uses rawData.email
                    name: name,
                    phone: phone,
                    whatsapp: whatsapp,
                    plan: txn.membership_plan || "silver",
                    amount: (Number(txn.amount) || 0) / 100,
                    status: txn.status || 'verified',
                    created_at: txn.created_at
                };

                const res = await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    successCount++;
                    syncedIds.push(txn.id);
                }
            } catch (innerErr) {
                console.error(`Failed to sync ID ${txn.id}`, innerErr);
            }
        }

        // 4. Mark Synced Records in DB
        if (syncedIds.length > 0) {
            await supabase.from('transactions')
                .update({ is_synced_to_sheet: true })
                .in('id', syncedIds);
        }

        return NextResponse.json({ count: successCount, total: transactions.length });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
