
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

        // 2. Fetch All Transactions
        // Sort by created_at ascending so we insert old->new
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, profiles(full_name, phone_number, email)')
            .order('created_at', { ascending: true });

        if (error) throw error;
        if (!transactions || transactions.length === 0) return NextResponse.json({ count: 0 });

        const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

        let successCount = 0;

        // 3. Serial Sync to avoid Race Conditions/Rate Limits
        for (const txn of transactions) {
            try {
                // Determine Name/Email
                let name = txn.student_name || txn.profiles?.full_name || "Unknown";
                let email = txn.student_email || txn.profiles?.email || "";

                // Get Phone & WhatsApp
                const phone = txn.student_phone || txn.profiles?.phone_number || "";
                const whatsapp = txn.whatsapp_number || "";

                const payload = {
                    id: txn.id,
                    payment_id: txn.razorpay_payment_id || "MANUAL",
                    user_email: email,
                    user_name: name,
                    phone: phone,          // New Field
                    whatsapp: whatsapp,    // New Field
                    plan_id: txn.membership_plan,
                    amount: (Number(txn.amount) || 0) / 100,
                    status: txn.status || 'verified',
                    created_at: txn.created_at
                };

                await fetch(GOOGLE_SCRIPT_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                successCount++;
            } catch (innerErr) {
                console.error(`Failed to sync ID ${txn.id}`, innerErr);
            }
        }

        return NextResponse.json({ count: successCount, total: transactions.length });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
