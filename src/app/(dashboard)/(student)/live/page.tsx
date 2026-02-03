// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { MetaballLoader } from "@/components/ui/metaball-loader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, ArrowRight, Loader2, Lock, Sparkles, Clock, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LiveCountDown } from "@/components/live/LiveCountDown";
import { ReschedulePicker } from "@/components/booking/ReschedulePicker";

export default function LivePage() {
    const [hasBookingAccess, setHasBookingAccess] = useState(false);
    const [hasLiveAccess, setHasLiveAccess] = useState(false);
    const [latestSession, setLatestSession] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [oneOnOneSettings, setOneOnOneSettings] = useState<any>(null); // New State
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
                        .eq('tier', (profile?.membership_tier || 'bronze').toLowerCase())
                        .single();

                    setHasBookingAccess(isInstructorOrAdmin || tierData?.has_booking_access || false);
                    setHasLiveAccess(isInstructorOrAdmin || tierData?.has_weekly_live_access || false);
                }

                // Fetch Weekly Live
                const { data: session } = await (supabase as any)
                    .from('weekly_live_sessions')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                setLatestSession(session);

                // Fetch One-on-One Settings
                const { data: oneOnOne } = await (supabase as any)
                    .from('one_on_one_settings')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                setOneOnOneSettings(oneOnOne);

                // Fetch 1-on-1 Bookings (For Live Section)
                const { data: myBookings } = await supabase
                    .from('bookings')
                    .select('*, profiles:instructor_id(full_name, avatar_url)')
                    .eq('user_id', user.id)
                    .eq('status', 'confirmed')
                    .gte('end_time', new Date().toISOString()) // SHOW UNTIL END TIME (Fix for disappearing cards)
                    .order('start_time', { ascending: true });

                if (myBookings) setBookings(myBookings);

            } catch (error) {
                console.error("Error checking access:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAccess();
    }, [supabase]);

    // Reschedule Logic
    const [rescheduleBooking, setRescheduleBooking] = useState<any>(null);

    // Cancel Logic
    const handleCancel = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this session? This will remove it from your calendar.")) return;

        try {
            const res = await fetch('/api/booking/cancel', {
                method: 'POST',
                body: JSON.stringify({ bookingId })
            });
            if (res.ok) {
                // Remove from state or reload
                setBookings(prev => prev.filter(b => b.id !== bookingId));
                // Optional: Toast
            } else {
                alert("Failed to cancel");
            }
        } catch (e) {
            console.error(e);
            alert("Error cancelling");
        }
    };

    if (!isLoading && !hasLiveAccess && !hasBookingAccess && bookings.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-slate-50 p-6">
                <p className="text-slate-500 font-medium text-center">
                    This section is not available for your account.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">

            {/* Reschedule Modal Overlay */}
            {rescheduleBooking && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-900">Reschedule Session</h3>
                            <Button variant="ghost" size="sm" onClick={() => setRescheduleBooking(null)}>Close</Button>
                        </div>
                        <div className="p-4">
                            <ReschedulePicker booking={rescheduleBooking} onSuccess={() => {
                                setRescheduleBooking(null);
                                window.location.reload(); // Refresh to show new time
                            }} />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 bg-clip-text text-transparent tracking-tight">Live Sessions</h1>
                <p className="text-slate-500 text-base max-w-2xl">
                    Join expert-led sessions and manage your 1-on-1 mentorship bookings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {isLoading ? (
                    <MetaballLoader fullscreen />
                ) : (
                    <>
                        {/* 0. Upcomming Bookings */}
                        {bookings.map((booking) => (
                            <div className="group relative" key={booking.id}>
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-2xl opacity-15 group-hover:opacity-30 blur transition duration-500" />
                                <Card className="relative h-full border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col">
                                    <div className="absolute top-3 right-3 z-20">
                                        <span className="bg-green-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            Confirmed
                                        </span>
                                    </div>

                                    <CardHeader className="pb-0 pt-6 px-5">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                            1-on-1 with {booking.profiles?.full_name}
                                        </CardTitle>
                                        <p className="text-xs text-slate-500">Mentorship Session</p>
                                    </CardHeader>

                                    <CardContent className="px-5 pt-4 pb-2 flex-grow space-y-4">
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                                                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Scheduled for</p>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {format(new Date(booking.start_time), "MMM do, h:mm a")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="scale-95 origin-left">
                                            <LiveCountDown targetDate={booking.start_time} endDate={booking.end_time} />
                                        </div>

                                        {booking.purpose && (
                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                                                    "Goal: {booking.purpose}"
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="px-5 pb-5 pt-0 gap-2 flex-col">
                                        <a href={booking.meet_link} target="_blank" rel="noreferrer" className="w-full">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                                                JOIN GOOGLE MEET
                                            </Button>
                                        </a>
                                        <div className="flex w-full gap-2">
                                            <Button variant="outline" className="flex-1 text-xs" onClick={() => setRescheduleBooking(booking)}>
                                                Reschedule
                                            </Button>
                                            <Button variant="destructive" className="flex-1 text-xs" onClick={() => handleCancel(booking.id)}>
                                                Cancel
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>
                        ))}

                        {/* 1. Weekly Live Class Card */}
                        {hasLiveAccess && (
                            <div className="group relative">
                                {/* Cool Blue/Indigo Glow */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl opacity-15 group-hover:opacity-30 blur transition duration-500" />

                                <Card className="relative h-full border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col">

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
                                                    Weekly Mastermind
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
                                            {latestSession?.title || "Business Scaling Workshop"}
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
                                                    <LiveCountDown targetDate={latestSession.scheduled_at} endDate={latestSession.end_time} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-4 text-center text-slate-400 text-sm italic">
                                                Join us to discuss Marketing & Automation strategies.
                                            </div>
                                        )}
                                    </CardContent>

                                    <CardFooter className="px-5 pb-5 pt-0">
                                        {latestSession ? (
                                            <a href={latestSession.join_url} target="_blank" rel="noreferrer" className="w-full">
                                                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 py-5 text-base font-bold tracking-wide transition-all hover:translate-y-[-1px]">
                                                    JOIN WORKSHOP
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
                        )}

                        {/* 2. 1-on-1 Mentorship Card (Updated for Business) */}
                        {hasBookingAccess && (
                            <div className="group relative">
                                {/* Mint/Teal Glow */}
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-2xl opacity-15 group-hover:opacity-30 blur transition duration-500" />

                                <Card className="relative h-full border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all overflow-hidden flex flex-col">
                                    {/* NEW IMAGE BANNER for Mentorship */}
                                    <div className="h-36 w-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                        {/* Image: Strategy/Business Growth */}
                                        <img
                                            src={oneOnOneSettings?.banner_url || "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600&auto=format&fit=crop"}
                                            alt="Business Consulting"
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute bottom-2 left-3 z-20">
                                            <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
                                                Digital Leadership
                                            </span>
                                        </div>
                                    </div>

                                    <CardHeader className="pb-0 pt-4 px-5">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                            {oneOnOneSettings?.title || "1-on-1 Strategy Call"}
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent className="px-5 pt-3 pb-2 flex-grow">
                                        <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {(oneOnOneSettings?.features || ["Meta & Social Media Strategy", "Automation & AI Setup", "Personal Branding Blueprint"]).map((feature: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-md">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>

                                    <CardFooter className="px-5 pb-5 pt-0">
                                        <Link href="/book-session" className="w-full">
                                            {/* Modern Button for Mentorship: Teal/Emerald */}
                                            <Button className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/20 py-5 text-base font-bold tracking-wide transition-all hover:translate-y-[-1px]">
                                                BOOK STRATEGY CALL
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}

                    </>
                )}
            </div>
        </div>
    );
}
