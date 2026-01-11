"use client";

import { useState, useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function BookingPage() {
    const router = useRouter();
    const supabase = createClient();

    const [step, setStep] = useState(1);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [selectedInstructor, setSelectedInstructor] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [membershipTier, setMembershipTier] = useState<string>("");

    // Calendar Availability
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    useEffect(() => {
        const init = async () => {
            await fetchInstructors();
            await fetchUserTier();
        };
        init();
    }, []);

    // When instructor loads or month changes, fetch availability
    useEffect(() => {
        if (selectedInstructor) {
            fetchAvailability(currentMonth);
        }
    }, [selectedInstructor, currentMonth]);

    const fetchAvailability = async (monthDate: Date) => {
        if (!selectedInstructor) return;
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;
        try {
            const res = await fetch(`/api/booking/availability-month?year=${year}&month=${month}&instructorId=${selectedInstructor}`);
            const dates: string[] = await res.json();
            if (Array.isArray(dates)) {
                // Convert YYYY-MM-DD to Date objects
                const dateObjs = dates.map(d => {
                    const parts = d.split('-');
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                });
                setAvailableDates(dateObjs);
            }
        } catch (e) {
            console.error("Failed to fetch calendar availability", e);
        }
    };

    const fetchUserTier = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('membership_tier').eq('id', user.id).single();
            setMembershipTier(data?.membership_tier || "");
        }
    };

    const fetchInstructors = async () => {
        try {
            const res = await fetch("/api/instructors/public");
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setInstructors(data);
                setSelectedInstructor(data[0].id); // Auto select first
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSlots = async (dateObj: Date | undefined) => {
        if (!dateObj || !selectedInstructor) return;

        // Timezone safe YYYY-MM-DD
        const offset = dateObj.getTimezoneOffset();
        const yyyymmdd = new Date(dateObj.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

        setLoading(true);
        try {
            const res = await fetch(`/api/booking/slots?date=${yyyymmdd}&instructorId=${selectedInstructor}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSlots(data);
            } else {
                setSlots([]);
                if (data.error) toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to load slots");
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (newDate: Date | undefined) => {
        setDate(newDate);
        setSelectedSlot(null);
        if (newDate) {
            fetchSlots(newDate);
        } else {
            setSlots([]);
        }
    };

    const handleBook = async () => {
        if (!selectedSlot || !date || !selectedInstructor) return;
        setBooking(true);
        try {
            const offset = date.getTimezoneOffset();
            const dateStr = new Date(date.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

            const res = await fetch("/api/booking/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: dateStr,
                    time: selectedSlot,
                    instructorId: selectedInstructor
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 403) {
                    toast.error("Upgrade Required: Your plan does not include 1-on-1 sessions.");
                } else {
                    toast.error(data.error || "Booking failed");
                }
                return;
            }

            setStep(2); // Success view
            toast.success("Booking Request Sent!");
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setBooking(false);
        }
    };

    if (step === 2) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] bg-white p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                    Your session has been scheduled. A confirmation email with the meeting link has been sent to your inbox.
                </p>
                <Button onClick={() => router.push("/live")} className="bg-purple-600 hover:bg-purple-700">
                    Back to Live Sessions
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Book a 1-on-1 Session</h1>
                    <p className="text-slate-500 mt-1">Select a date from the calendar to see available slots.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Calendar */}
                <Card className="h-fit shadow-md border-0 bg-white ring-1 ring-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Select Date</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center p-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            className="rounded-md border shadow-sm w-full max-w-sm"
                            modifiersClassNames={{
                                available: "bg-green-100 text-green-700 font-bold hover:bg-green-200 rounded-full"
                            }}
                            modifiers={{
                                available: availableDates
                            }}
                            classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-medium",
                                nav: "space-x-1 flex items-center",
                                nav_button: cn(
                                    buttonVariants({ variant: "outline" }),
                                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                                ),
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                                ),
                                day_range_end: "day-range-end",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground",
                                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                day_disabled: "text-muted-foreground opacity-50",
                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                        <style jsx global>{`
                            .rdp-month_grid { display: table !important; width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; }
                            .rdp-weekdays { display: table-row !important; }
                            .rdp-weekday { display: table-cell !important; width: 14.28% !important; text-align: center !important; }
                            .rdp-weeks { display: table-row-group !important; }
                            .rdp-week { display: table-row !important; }
                            .rdp-day { display: table-cell !important; width: 14.28% !important; text-align: center !important; }
                            td[role="gridcell"] { display: table-cell !important; width: 14.28% !important; } 
                            .rdp-day_button { margin: 0 auto !important; }
                        `}</style>
                    </CardContent>

                    {['bronze', 'silver', 'Bronze', 'Silver'].includes(membershipTier) && (
                        <div className="p-4 pt-0">
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start gap-2 text-sm">
                                <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Limited Period Offer</p>
                                    <p className="text-xs opacity-80 pl-0">Exclusive access for members.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Right: Slots */}
                <Card className="flex flex-col h-full min-h-[400px] shadow-md border-0 ring-1 ring-slate-200">
                    <CardHeader className="border-b bg-slate-50/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-600" />
                                    Available Slots
                                </CardTitle>
                                <CardDescription>
                                    {date ? `Availability for ${date.toDateString()}` : "Select a date to view time slots"}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                                <p>Finding slots...</p>
                            </div>
                        ) : !date ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed rounded-xl m-4 bg-slate-50/50">
                                <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium">No Date Selected</p>
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Clock className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-slate-900">No Slots Available</h3>
                                <p className="text-sm text-slate-500 max-w-xs text-center mt-1">
                                    No slots found on this date.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in zoom-in duration-300">
                                {slots.map((slot) => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all relative overflow-hidden group ${selectedSlot === slot
                                            ? "bg-purple-600 text-white border-purple-600 shadow-lg scale-105"
                                            : "hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 bg-white"
                                            }`}
                                    >
                                        {slot}
                                        {selectedSlot === slot && (
                                            <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    {selectedSlot && (
                        <div className="p-6 border-t bg-slate-50 mt-auto animate-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 uppercase font-semibold tracking-wider">You Selected</p>
                                    <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        {date?.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        <span className="text-slate-300">•</span>
                                        {selectedSlot}
                                    </div>
                                </div>
                                <Button size="lg" onClick={handleBook} disabled={booking} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all">
                                    {booking ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ...
                                        </>
                                    ) : (
                                        <>
                                            Confirm
                                            <CheckCircle className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
