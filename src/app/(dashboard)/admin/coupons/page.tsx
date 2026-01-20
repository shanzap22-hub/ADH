import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CouponsManager from "@/components/admin/CouponsManager";

export default async function AdminCouponsPage() {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    // Role Check
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

    // Allow admin and super_admin
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
        redirect("/dashboard");
    }

    return (
        <div className="p-4 md:p-8 pt-6">
            <CouponsManager />
        </div>
    );
}
