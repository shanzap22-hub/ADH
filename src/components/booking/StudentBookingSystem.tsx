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
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);

    // Success State
    const [bookedSession, setBookedSession] = useState<any>(null);

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
                // Auto-select first one (usually Admin for ADH)
                setSelectedInstructor(data[0].id);
            }
            setLoading(false);
        };
        fetchInstructors();
    }, [supabase]);

    // 2. Fetch Slots when Date/Instructor changes
    useEffect(() => {
        if (!selectedInstructor || !date) return;

        const fetchSlots = async () => {
            setSlots([]);
            setSelectedSlot(null);

            // Format YYYY-MM-DD
            // Important: Handle timezone offset correctly or use local string logic
            // simple hack: 
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

    if (bookedSession) {
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
                            {bookedSession.time}
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Controls */}
            <div className="md:col-span-8 space-y-6">

                {/* 1. Instructor Selection */}
                {instructors.length > 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Select Mentor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {instructors.map(inst => (
                                    <div
                                        key={inst.id}
                                        onClick={() => setSelectedInstructor(inst.id)}
                                        className={`cursor-pointer flex flex-col items-center p-4 rounded-xl border transition-all min-w-[120px] ${selectedInstructor === inst.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm ring-1 ring-purple-500' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Avatar className="w-16 h-16 mb-3">
                                            <AvatarImage src={inst.avatar_url} />
                                            <AvatarFallback>{inst.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-sm font-medium text-center truncate w-full">{inst.full_name}</p>
                                        <p className="text-[10px] text-slate-500 capitalize">{inst.role}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 2. Calendar */}
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Select Date</CardTitle>
                        <CardDescription>Choose a day for your session</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center p-0 md:p-6">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                            className="rounded-md border-0"
                            classNames={{
                                head_cell: "text-slate-500 font-normal text-[0.8rem] uppercase w-10 h-10 md:w-12 md:h-12 flex items-center justify-center",
                                cell: "h-10 w-10 md:h-12 md:w-12 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected])]:bg-purple-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-10 w-10 md:h-12 md:w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-full",
                                day_selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white shadow-md",
                                day_today: "bg-slate-100 text-slate-900 font-bold",
                            }}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Right: Slots & Confirm */}
            <div className="md:col-span-4 space-y-6">
                <Card className="h-full border-l-4 border-l-purple-500 shadow-md">
                    <CardHeader>
                        <CardTitle>Available Slots</CardTitle>
                        <CardDescription>
                            {date ? format(date, "EEEE, MMM do") : "Select a date"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!date ? (
                            <div className="text-center py-10 text-slate-400">
                                <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>Please select a date from the calendar</p>
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                                <p>No slots available on this date.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                                {slots.map(slot => (
                                    <Button
                                        key={slot}
                                        variant={selectedSlot === slot ? "default" : "outline"}
                                        className={selectedSlot === slot ? "bg-purple-600 hover:bg-purple-700" : "hover:border-purple-300"}
                                        onClick={() => setSelectedSlot(slot)}
                                    >
                                        {slot}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex-col gap-3 pt-4 border-t">
                        <Button
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12 text-lg shadow-lg shadow-purple-500/20"
                            disabled={!selectedSlot || booking}
                            onClick={handleBooking}
                        >
                            {booking ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                "Book Session"
                            )}
                        </Button>
                        <p className="text-xs text-center text-slate-400">
                            You wil receive a Google Calendar invite via email.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
