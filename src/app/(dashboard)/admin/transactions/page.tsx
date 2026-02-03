import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TransactionsManager from "@/components/admin/transactions-manager";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
    const supabase = await createClient();

    // Verify Super Admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin') redirect("/dashboard");

    return (
        <div className="p-6">
            <TransactionsManager />
        </div>
    );
}
