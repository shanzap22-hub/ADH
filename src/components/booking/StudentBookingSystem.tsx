"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function StudentBookingSystem() {
    const [instructors, setInstructors] = useState<any[]>([]);

    const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
    const [date, setDate] = useState<Date | undefined>(undefined); // Start with NO date selected
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSlotLoading, setIsSlotLoading] = useState(false); // Specific loading state for slots
    const [booking, setBooking] = useState(false);

    // Success State
    const [bookedSession, setBookedSession] = useState<any>(null);
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    const supabase = createClient();
    const router = useRouter();

    // 1. Fetch Instructors
    useEffect(() => {
        const fetchInstructors = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, role')
                .in('role', ['instructor', 'admin', 'super_admin'])
                .limit(10);

            if (data && data.length > 0) {
                setInstructors(data);
                // Auto-select first one (Default behavior)
                let instructorIdForCalendar = selectedInstructor;
                if (!selectedInstructor) {
                    const firstId = data[0].id;
                    setSelectedInstructor(firstId);
                    instructorIdForCalendar = firstId;
                }
                console.log("DEBUG_INSTRUCTOR_ID:", instructorIdForCalendar);

                // Fetch Available Dates (Month View)
                try {
                    const res = await fetch(`/api/booking/calendar-availability?instructorId=${instructorIdForCalendar}`);
                    if (res.ok) {
                        const dates = await res.json();
                        setAvailableDates(dates);
                    }
                } catch (e) {
                    console.error("Failed to fetch calendar availability", e);
                }
            }
            setLoading(false);
        };
        fetchInstructors();
    }, [supabase]);

    // 2. Fetch Slots when Date/Instructor changes
    useEffect(() => {
        if (!selectedInstructor || !date) return;

        const fetchSlots = async () => {
            setIsSlotLoading(true);
            setSlots([]);
            setSelectedSlot(null);

            // Format YYYY-MM-DD
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            try {
                const res = await fetch(`/api/booking/slots?instructorId=${selectedInstructor}&date=${dateStr}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setSlots(data);
                    }
                }
            } catch (e) {
                console.error("Slot fetch error", e);
            } finally {
                setIsSlotLoading(false);
            }
        };

        fetchSlots();
    }, [selectedInstructor, date]);

    const handleBooking = async () => {
        if (!selectedInstructor || !date || !selectedSlot) return;

        setBooking(true);
        try {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            const res = await fetch('/api/booking/create', {
                method: 'POST',
                body: JSON.stringify({
                    instructorId: selectedInstructor,
                    date: dateStr,
                    time: selectedSlot
                })
            });

            const data = await res.json();
            if (data.googleError) {
                console.error("GOOGLE_SYNC_DEBUG:", data.googleError);
            }
            if (!res.ok) throw new Error(data.error || "Booking Failed");

            setBookedSession({
                date: date,
                time: selectedSlot,
                instructor: instructors.find(i => i.id === selectedInstructor)
            });
            toast.success("Session Booked Successfully!");

            // Refresh router to update booking counts/dashboard etc
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setBooking(false);
        }
    };

    const handleBackToCalendar = () => {
        setDate(undefined);
        setSlots([]);
        setSelectedSlot(null);
    };

    if (bookedSession) {
        // ... (Keep existing Success UI logic, omitted here for brevity if it was external, but since I am replacing the block, I will include it or reference it. 
        // Wait, I should include the full Success UI block here as I am replacing a large chunk)
        return (
            <Card className="max-w-md mx-auto mt-10 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="pt-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Booking Confirmed!</h2>
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                            Your session has been scheduled.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-black/20 p-4 rounded-lg text-sm text-left inline-block w-full">
                        <p className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 opacity-70" />
                            {format(bookedSession.date, "EEEE, MMMM do, yyyy")}
                        </p>
                        <p className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 opacity-70" />
                            {/* Format 24h to 12h for display */}
                            {new Date(`2000-01-01T${bookedSession.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                        <p className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                                <AvatarImage src={bookedSession.instructor?.avatar_url} />
                                <AvatarFallback>{bookedSession.instructor?.full_name?.[0]}</AvatarFallback>
                            </Avatar>
                            with {bookedSession.instructor?.full_name}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                            Go to Dashboard
                        </Button>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setBookedSession(null)}>
                            Book Another
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (

        <div className="max-w-xl mx-auto">
            <Card className="shadow-lg border-t-4 border-t-purple-600">
                <CardHeader>
                    {/* Header adjusts based on step */}
                    {!date ? (
                        <>
                            <CardTitle>Select a Date</CardTitle>
                            <CardDescription>Choose a day for your 1-on-1 session</CardDescription>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleBackToCalendar} className="-ml-2">
                                ← Back
                            </Button>
                            <div>
                                <CardTitle>{format(date, "EEE, MMM do")}</CardTitle>
                                <CardDescription>Select a time</CardDescription>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="min-h-[400px] flex flex-col">
                    {!date ? (
                        // Step 1: Calendar View
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={(date) => {
                                    // Disable past dates, future > 30 days, AND days NOT in availableDays
                                    const isPast = date < new Date();
                                    const isTooFar = date > addDays(new Date(), 30);
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    // Disable if not in availableDates list (and valid range)
                                    // Make sure we don't disable if checking hasn't finished? 
                                    // For now, assume empty list means no slots.
                                    const isUnavailable = availableDates.length > 0 && !availableDates.includes(dateStr);

                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return date < today || isTooFar || isUnavailable;
                                }}
                                modifiers={{
                                    available: (date) => availableDates.includes(format(date, 'yyyy-MM-dd'))
                                }}
                                modifiersClassNames={{
                                    available: "bg-green-100 text-green-900 font-bold hover:bg-green-200 rounded-full cursor-pointer relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-500 after:rounded-full"
                                }}
                                className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm bg-white dark:bg-black"
                                classNames={{
                                    head_cell: "text-slate-500 font-normal text-[0.8rem] uppercase w-10 h-10 flex items-center justify-center",
                                    cell: "h-10 w-10 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected])]:bg-purple-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-full",
                                    day_selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white shadow-md",
                                    day_today: "bg-slate-100 text-slate-900 font-bold",
                                }}
                            />
                        </div>
                    ) : (
                        // Step 2: Time Slots View
                        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                            {isSlotLoading ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
                                    <p>Checking availability...</p>
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
                                    <AlertCircle className="w-10 h-10 mb-2 opacity-30" />
                                    <p>No available slots for this date.</p>
                                    <Button variant="link" onClick={handleBackToCalendar} className="mt-2 text-purple-600">
                                        Check another date
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {slots.map(slot => {
                                        // Convert 13:00 -> 1:00 PM for display
                                        const [h, m] = slot.split(':');
                                        const dateObj = new Date();
                                        dateObj.setHours(parseInt(h), parseInt(m));
                                        const displayTime = dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

                                        return (
                                            <Button
                                                key={slot}
                                                variant={selectedSlot === slot ? "default" : "outline"}
                                                className={`h-12 ${selectedSlot === slot ? "bg-purple-600 hover:bg-purple-700 ring-2 ring-purple-600 ring-offset-2" : "hover:border-purple-400 border-slate-200"}`}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {displayTime}
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Confirm Button Area */}
                            <div className="mt-8 border-t pt-4">
                                <Button
                                    className="w-full h-12 text-lg bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 transaction-all"
                                    disabled={!selectedSlot || booking}
                                    onClick={handleBooking}
                                >
                                    {booking ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Scheduling...
                                        </>
                                    ) : (
                                        "Confirm Booking"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
