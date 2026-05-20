import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreditCard } from "lucide-react";
import { PaymentLinksManager } from "@/components/admin/PaymentLinksManager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentLinksPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
        return redirect("/");
    }

    // Check if user is super admin
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "super_admin") {
        return redirect("/dashboard");
    }

    // Fetch all courses
    const { data: courses } = await supabase
        .from("courses")
        .select("id, title, price")
        .order("title", { ascending: true });

    // Fetch tier pricing info
    const { data: tierPricing } = await supabase
        .from("tier_pricing")
        .select("tier, name, price")
        .order("price", { ascending: true });

    // Fetch existing payment links
    const { data: paymentLinks } = await supabase
        .from("payment_links")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Dynamic Payment Links</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Generate and distribute shareable Razorpay checkout links for Programs and Membership Tiers
                    </p>
                </div>
            </div>

            <PaymentLinksManager
                courses={courses || []}
                tierPricing={tierPricing || []}
                initialLinks={paymentLinks || []}
            />
        </div>
    );
}
