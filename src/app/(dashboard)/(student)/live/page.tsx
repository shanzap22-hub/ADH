"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Calendar, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LivePage() {
    const [hasBookingAccess, setHasBookingAccess] = useState(false);
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
                    .select('membership_tier')
                    .eq('id', user.id)
                    .single();

                if (profile?.membership_tier) {
                    const { data: tierData } = await supabase
                        .from('tier_pricing')
                        .select('has_booking_access')
                        .eq('tier', profile.membership_tier)
                        .single();

                    setHasBookingAccess(tierData?.has_booking_access || false);
                }
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
                {/* 1-on-1 Booking Card - Conditionally Rendered */}
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
                        <CardContent>
                            <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400 mb-4">
                                <li className="flex items-center gap-2">✓ Personalized guidance</li>
                                <li className="flex items-center gap-2">✓ Flexible timing</li>
                                <li className="flex items-center gap-2">✓ 30-min sessions</li>
                            </ul>
                        </CardContent>
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

                {/* Placeholder for Weekly Live */}
                <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500 opacity-60 grayscale hover:grayscale-0 hover:opacity-100">
                    <CardHeader>
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center mb-4">
                            <Video className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <CardTitle>Weekly Live Class</CardTitle>
                        <CardDescription>
                            Join our community live sessions every weekend covering trending topics.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/10 p-3 rounded-md">
                            Coming Soon
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button disabled variant="outline" className="w-full">
                            Schedule Coming Soon
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
