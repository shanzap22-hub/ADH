// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, ArrowRight, Loader2, Lock, Sparkles, Clock } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LiveCountDown } from "@/components/live/LiveCountDown";
import { cn } from "@/lib/utils";

export default function LivePage() {
    const [hasBookingAccess, setHasBookingAccess] = useState(false);
    const [hasLiveAccess, setHasLiveAccess] = useState(false);
    const [latestSession, setLatestSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsLoading(false);
                    return;
                }

                // Get User Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('membership_tier, role')
                    .eq('id', user.id)
                    .single();

                const isInstructorOrAdmin = ['admin', 'super_admin', 'instructor'].includes(profile?.role || '');

                if (profile?.membership_tier || isInstructorOrAdmin) {
                    // Check Tier Privileges
                    const { data: tierData } = await supabase
                        .from('tier_pricing')
                        .select('has_booking_access, has_weekly_live_access')
                        .eq('tier', profile?.membership_tier || 'bronze') // Fallback checks bronze default
                        .single();

                    setHasBookingAccess(isInstructorOrAdmin || tierData?.has_booking_access || false);
                    setHasLiveAccess(isInstructorOrAdmin || tierData?.has_weekly_live_access || false);
                }

                // Fetch Latest Session
                const { data: session } = await (supabase as any)
                    .from('weekly_live_sessions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                setLatestSession(session);

            } catch (error) {
                console.error("Error checking access:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        Live Sessions
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Interactive learning experiences designed for you.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* 1. Weekly Live Class Card (Now First) */}
                <div className="group relative">
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-orange-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500" />

                    <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl overflow-hidden flex flex-col">
                        {!hasLiveAccess && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-20 p-6 text-center">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 transform scale-100 hover:scale-105 transition-transform">
                                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Lock className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                                    </div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Premium Content</h3>
                                    <p className="text-sm text-slate-500 mt-1 mb-3">Upgrade your plan to access weekly live sessions.</p>
                                    <Button size="sm" variant="outline" className="w-full">View Plans</Button>
                                </div>
                            </div>
                        )}

                        {/* Banner Image */}
                        {latestSession?.banner_url ? (
                            <div className="h-48 w-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <img
                                    src={latestSession.banner_url}
                                    alt="Live Banner"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute bottom-3 left-4 z-20">
                                    <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                        Live Series
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 bg-gradient-to-r from-violet-100 to-orange-50 dark:from-violet-950/30 dark:to-orange-950/20 flex items-center justify-center">
                                <Video className="w-12 h-12 text-violet-300 dark:text-orange-700/50" />
                            </div>
                        )}

                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                {latestSession?.title || "Weekly Community Live"}
                                {latestSession && <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-grow">
                            {latestSession ? (
                                <div className="space-y-5 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                                            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Next Session</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                {format(new Date(latestSession.scheduled_at), "EEEE, MMM do 'at' h:mm a")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-1">
                                        <LiveCountDown targetDate={latestSession.scheduled_at} />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Video className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">No upcoming sessions scheduled.</p>
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="pt-2">
                            {latestSession ? (
                                <a href={latestSession.join_url} target="_blank" rel="noreferrer" className="w-full">
                                    <Button className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white shadow-lg shadow-purple-500/20 py-6 text-lg font-bold tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        JOIN LIVE CLASS
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 mt-2">
                                        Session starts 15 mins early
                                    </p>
                                </a>
                            ) : (
                                <Button disabled variant="secondary" className="w-full">
                                    Stay Tuned
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* 2. 1-on-1 Booking Card (Now Second) */}
                {hasBookingAccess && (
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-200 to-slate-400 dark:from-slate-800 dark:to-slate-700 rounded-2xl opacity-10 group-hover:opacity-30 blur transition duration-500" />

                        <Card className="relative h-full border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col">
                            <CardHeader>
                                <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/30 dark:to-slate-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-7 h-7 text-slate-600 dark:text-slate-400" />
                                </div>
                                <CardTitle className="text-xl">1-on-1 Mentorship</CardTitle>
                                <CardDescription className="text-base">
                                    Personalized guidance from industry experts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        Clear specific doubts
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        Career path planning
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        Project reviews
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Link href="/book-session" className="w-full">
                                    <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-slate-300 group-hover:border-slate-500 transition-colors py-6">
                                        Book a Session
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                )}

            </div>
        </div>
    );
}
