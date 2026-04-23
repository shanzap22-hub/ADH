"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, Calendar as CalendarIcon, Clock, X } from "lucide-react";

interface Booking {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    user: {
        full_name: string;
        email: string;
    };
    meeting_link: string;
}

export default function InstructorCalendarPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchBookings = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch bookings assigned to me or all if admin
        // Assuming current user is instructor.
        const { data } = await supabase
            .from("bookings")
            .select(`
                *,
                user:user_id (full_name, email)
            `)
            .eq("instructor_id", user.id)
            .gte("start_time", new Date().toISOString()) // Only upcoming? Or all. Let's show all descending.
            .order("start_time", { ascending: true });

        if (data) {
            setTimeout(() => setBookings(data), 0);
        }
        setTimeout(() => setLoading(false), 0);
    }, [supabase]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleCancel = async (bookingId: string) => {
        if (!confirm("Cancel this session?")) return;

        const { error } = await supabase
            .from("bookings")
            .update({ status: 'cancelled' })
            .eq("id", bookingId);

        if (error) toast.error("Failed");
        else {
            toast.success("Cancelled");
            fetchBookings();
        }
    };

    if (loading) return <div className="p-6">Loading calendar...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Session Calendar</h1>
                <Button variant="outline" onClick={() => toast.info("Google Calendar API not configured yet")}>Sync with Google Calendar</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming List */}
                <div className="lg:col-span-2 space-y-4">
                    {bookings.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center text-gray-500">
                                No upcoming sessions scheduled.
                            </CardContent>
                        </Card>
                    ) : (
                        bookings.map(booking => (
                            <Card key={booking.id} className={booking.status === 'cancelled' ? 'opacity-50' : ''}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-purple-100 p-3 rounded-full text-purple-600 font-bold text-center min-w-[60px]">
                                            {new Date(booking.start_time).getDate()}
                                            <div className="text-xs font-normal uppercase">{new Date(booking.start_time).toLocaleDateString('en-US', { month: 'short' })}</div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{booking.user?.full_name || "Student"}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {booking.status === 'cancelled' && <span className="text-red-500 text-xs font-bold">CANCELLED</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" title="Reschedule / Email">
                                            <Mail className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() => handleCancel(booking.id)}
                                            disabled={booking.status === 'cancelled'}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Mini Calendar / Summary */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Today's Sessions</span>
                                    <span className="font-bold">0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>This Week</span>
                                    <span className="font-bold">{bookings.length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
