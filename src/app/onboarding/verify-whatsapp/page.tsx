import VerifyWhatsappClient from "./VerifyWhatsappClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function VerifyWhatsappPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect unauthenticated users to login
    if (!user) {
        redirect("/login");
    }

    // Verify from profile table
    const { data: profile } = await supabase
        .from("profiles")
        .select("whatsapp_number, setup_required")
        .eq("id", user.id)
        .single();

    // If onboarding is already complete, redirect to dashboard
    const setupRequired = user.user_metadata?.setup_required;
    if (setupRequired === false && profile?.setup_required === false) {
        redirect("/dashboard");
    }

    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        }>
            <VerifyWhatsappClient />
        </Suspense>
    );
}
