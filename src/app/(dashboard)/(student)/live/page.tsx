// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, ArrowRight, Loader2, Lock, Sparkles, Clock, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LiveCountDown } from "@/components/live/LiveCountDown";

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

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('membership_tier, role')
                    .eq('id', user.id)
                    .single();

                const isInstructorOrAdmin = ['admin', 'super_admin', 'instructor'].includes(profile?.role || '');

                if (profile?.membership_tier || isInstructorOrAdmin) {
                    const { data: tierData } = await supabase
                        .from('tier_pricing')
                        .select('has_booking_access, has_weekly_live_access')
                        .eq('tier', profile?.membership_tier || 'bronze')
                        .single();

                    setHasBookingAccess(isInstructorOrAdmin || tierData?.has_booking_access || false);
                    setHasLiveAccess(isInstructorOrAdmin || tierData?.has_weekly_live_access || false);
                }

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
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    Live Sessions
                </h1>
                <p className="text-slate-500 text-base">
                    Interactive learning experiences.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Weekly Live Class Card */}
                <div className="group relative">
                    {/* Cool Blue/Indigo Glow */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl opacity-15 group-hover:opacity-30 blur transition duration-500" />

                    <Card className="relative h-full border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col">
                        {!hasLiveAccess && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-20 p-6 text-center">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800">
                                    <Lock className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                    <h3 className="font-bold text-slate-900 dark:text-white">Premium Only</h3>
                                    <Button size="sm" variant="outline" className="mt-3 w-full border-indigo-200 text-indigo-700">View Plans</Button>
                                </div>
                            </div>
                        )}

                        {/* Reduced Height Banner */}
                        {latestSession?.banner_url ? (
                            <div className="h-36 w-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                                <img
                                    src={latestSession.banner_url}
                                    alt="Live Banner"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute bottom-2 left-3 z-20">
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                                        Weekly Live
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 flex items-center justify-center">
                                <Video className="w-10 h-10 text-indigo-200 dark:text-indigo-800" />
                            </div>
                        )}

                        <CardHeader className="pb-0 pt-4 px-5">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                {latestSession?.title || "Community Live"}
                                {latestSession && <Sparkles className="w-4 h-4 text-indigo-500" />}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="px-5 pt-3 pb-2 flex-grow">
                            {latestSession ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Scheduled for</p>
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {format(new Date(latestSession.scheduled_at), "MMM do, h:mm a")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="scale-95 origin-left">
                                        <LiveCountDown targetDate={latestSession.scheduled_at} />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center text-slate-400 text-sm italic">
                                    Schedule updated every Monday.
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className="px-5 pb-5 pt-0">
                            {latestSession ? (
                                <a href={latestSession.join_url} target="_blank" rel="noreferrer" className="w-full">
                                    {/* NEW GRADIENT: Blue/Cyan/Indigo - Fresh & Modern */}
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 py-5 text-base font-bold tracking-wide transition-all hover:translate-y-[-1px]">
                                        JOIN CLASS
                                    </Button>
                                </a>
                            ) : (
                                <Button disabled variant="secondary" className="w-full h-10 text-sm">
                                    Coming Soon
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* 2. 1-on-1 Mentorship Card */}
                {hasBookingAccess && (
                    <div className="group relative">
                        {/* Mint/Teal Glow */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-2xl opacity-15 group-hover:opacity-30 blur transition duration-500" />

                        <Card className="relative h-full border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col">
                            {/* NEW IMAGE BANNER for Mentorship */}
                            <div className="h-36 w-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                {/* Stock image from Unsplash for Mentorship/Meeting */}
                                <img
                                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop"
                                    alt="Mentorship"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute bottom-2 left-3 z-20">
                                    <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                                        Personal Guidance
                                    </span>
                                </div>
                            </div>

                            <CardHeader className="pb-0 pt-4 px-5">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                    1-on-1 Mentorship
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="px-5 pt-3 pb-2 flex-grow">
                                <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                        Career Roadmap Planning
                                    </li>
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                        Project Review & Feedback
                                    </li>
                                    <li className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-md">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                        Technical Doubt Clearance
                                    </li>
                                </ul>
                            </CardContent>

                            <CardFooter className="px-5 pb-5 pt-0">
                                <Link href="/book-session" className="w-full">
                                    {/* Modern Button for Mentorship: Teal/Emerald */}
                                    <Button className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 py-5 text-base font-bold tracking-wide transition-all hover:translate-y-[-1px]">
                                        BOOK SESSION
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
