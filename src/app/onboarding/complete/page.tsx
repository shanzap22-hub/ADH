import CompleteProfileClient from "./CompleteProfileClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export default async function CompleteProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect unauthenticated users to login
    if (!user) {
        redirect("/login");
    }

    // Check if user has already completed onboarding
    const setupRequired = user.user_metadata?.setup_required;

    // Also verify from profile table (double check for data integrity)
    const { data: profile } = await supabase
        .from("profiles")
        .select("phone_number, setup_required")
        .eq("id", user.id)
        .single();

    // CRITICAL: If setup is already complete, redirect to dashboard
    // This prevents users from re-accessing and re-submitting the onboarding form
    if (setupRequired === false && profile?.phone_number) {
        console.log('[ONBOARDING] User already completed setup, redirecting to dashboard:', user.email);
        redirect("/dashboard");
    }

    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
            <CompleteProfileClient />
        </Suspense>
    );
}
