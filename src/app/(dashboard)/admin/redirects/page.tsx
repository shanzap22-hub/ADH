import { createClient } from "@/lib/supabase/server";
import { RedirectsClient } from "@/components/admin/RedirectsClient";

export const dynamic = 'force-dynamic';

export default async function RedirectsPage() {
    const supabase = await createClient();

    // Fetch redirects sorted by newest
    const { data } = await supabase
        .from('redirects')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Redirect Manager</h1>
                <p className="text-slate-500">Create short links (e.g. adh.today/offer) that redirect to external URLs.</p>
            </div>

            <RedirectsClient initialRedirects={data || []} />
        </div>
    );
}
