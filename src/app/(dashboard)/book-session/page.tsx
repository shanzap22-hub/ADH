"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

// ⚠️ REPLACE THIS WITH YOUR CALENDLY EVENT LINK
const CALENDLY_URL = "https://calendly.com/adh-digital/strategy-call";

export default function BookSessionPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { setIsLoading(false); return; }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('membership_tier, role')
                    .eq('id', user.id)
                    .single();

                const isInstructorOrAdmin = ['admin', 'super_admin', 'instructor'].includes(profile?.role || '');

                if (isInstructorOrAdmin) {
                    setHasAccess(true);
                } else if (profile?.membership_tier) {
                    const { data: tierData } = await supabase
                        .from('tier_pricing')
                        .select('has_booking_access')
                        .eq('tier', profile.membership_tier)
                        .single();
                    setHasAccess(tierData?.has_booking_access || false);
                }
            } catch (error) {
                console.error("Access check failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkAccess();
    }, [supabase]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
    }

    // Access Restricted View
    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-slate-50 dark:bg-slate-900 p-6">
                <Card className="w-full max-w-md text-center p-8 border-amber-200 bg-amber-50 dark:bg-amber-950/30 rounded-2xl shadow-xl">
                    <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Lock className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300 text-lg">
                        1-on-1 Strategy Calls are available exclusively for Premium Members.
                    </CardDescription>
                    <p className="text-sm text-slate-500 mt-4 mb-6">Upgrade your plan to unlock personal mentorship.</p>
                    <Link href="/courses">
                        <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg">
                            Upgrade Now
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    // Booking Page View
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center shadow-sm z-10 sticky top-0">
                <div className="max-w-7xl mx-auto w-full flex items-center gap-4">
                    <Link href="/live">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">Book Your Strategy Call</h1>
                        <p className="text-xs text-slate-500 hidden md:block">Select a time slot that works for you.</p>
                    </div>
                </div>
            </div>

            {/* Calendly Widget */}
            <div className="flex-1 p-0 md:p-6 overflow-hidden">
                <div className="w-full h-full min-h-[800px] bg-white dark:bg-slate-900 md:rounded-2xl md:shadow-lg md:border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                    <div
                        className="calendly-inline-widget w-full h-full"
                        data-url={CALENDLY_URL}
                        style={{ minWidth: '320px', height: '100%' }}
                    />
                    <Script
                        type="text/javascript"
                        src="https://assets.calendly.com/assets/external/widget.js"
                        strategy="lazyOnload"
                    />
                </div>
            </div>
        </div>
    );
}
