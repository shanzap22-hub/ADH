"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, ArrowRight, Loader2, Lock } from "lucide-react";
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
                const { data: session } = await supabase
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
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Live Sessions</h1>
                <p className="text-slate-500 mt-1">Join live classes or book 1-on-1 mentorship.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1-on-1 Booking Card */}
                {hasBookingAccess && (
                    <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500 animate-in fade-in zoom-in duration-300">
                        <CardHeader>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <CardTitle>1-on-1 Mentorship</CardTitle>
                            <CardDescription>
                                Book a personal session with an expert instructor to clear doubts or get career guidance.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Link href="/book-session" className="w-full">
                                <Button className="w-full bg-purple-600 hover:bg-purple-700 group">
                                    Book Now
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                )}

                {/* Weekly Live Class Card */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500 overflow-hidden relative">
                    {!hasLiveAccess && (
                        <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 p-6 text-center">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-xl border">
                                <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                <h3 className="font-bold">Upgrade to Access</h3>
                                <p className="text-xs text-slate-500 mt-1">Weekly Live Classes are locked for your plan.</p>
                            </div>
                        </div>
                    )}

                    {latestSession?.banner_url && (
                        <div className="h-40 w-full overflow-hidden">
                            <img src={latestSession.banner_url} alt="Live Banner" className="w-full h-full object-cover" />
                        </div>
                    )}

                    <CardHeader className={latestSession?.banner_url ? "pt-4" : ""}>
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-4">
                            <Video className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle>{latestSession?.title || "Weekly Live Class"}</CardTitle>
                        <CardDescription>
                            Join our community live sessions every weekend.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {latestSession ? (
                            <div className="space-y-4">
                                <LiveCountDown targetDate={latestSession.scheduled_at} />
                                <div className="text-xs text-slate-500">
                                    Next Session: {new Date(latestSession.scheduled_at).toLocaleString()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md">
                                No session scheduled yet.
                            </div>
                        )}
                    </CardContent>

                    <CardFooter>
                        {latestSession ? (
                            <a href={latestSession.join_url} target="_blank" rel="noreferrer" className="w-full">
                                <Button className="w-full bg-amber-600 hover:bg-amber-700 font-bold">
                                    Join Live Class
                                </Button>
                            </a>
                        ) : (
                            <Button disabled variant="outline" className="w-full">
                                Schedule Coming Soon
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
