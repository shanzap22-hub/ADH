"use client";

import { useState } from "react";
import { format, addDays, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { createBooking } from "@/actions/booking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock Slots (In fully custom system, fetch from DB/Google)
const PREDEFINED_SLOTS = [
    { id: "10-00", label: "10:00 AM", hour: 10 },
    { id: "11-00", label: "11:00 AM", hour: 11 },
    { id: "14-00", label: "02:00 PM", hour: 14 },
    { id: "16-00", label: "04:00 PM", hour: 16 },
    { id: "19-00", label: "07:00 PM", hour: 19 },
];

export function BookingWidget() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleBook = async () => {
        if (!date || !selectedSlot) return;

        setIsSubmitting(true);
        try {
            // Construct full date object
            const slot = PREDEFINED_SLOTS.find(s => s.id === selectedSlot);
            const bookingDate = new Date(date);
            bookingDate.setHours(slot!.hour, 0, 0, 0);

            const res = await createBooking(bookingDate);

            if (res.error) {
                toast.error(res.error);
            } else {
                setIsSuccess(true);
                toast.success("Booking Request Sent!");
            }
        } catch (err) {
            toast.error("Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <Card className="w-full max-w-3xl mx-auto h-[500px] flex items-center justify-center border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
                <div className="text-center p-8">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in spin-in-12 duration-500">
                        <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Request Received!</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        Your strategy call request has been sent. You will receive a confirmation email with the Meeting Link shortly.
                    </p>
                    <Button
                        onClick={() => { setIsSuccess(false); setSelectedSlot(null); }}
                        className="mt-6 bg-green-600 hover:bg-green-700"
                    >
                        Book Another
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl mx-auto">
            {/* Calendar Section */}
            <Card className="md:col-span-5 border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-500" />
                        Select Date
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center p-0 pb-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) => date < addDays(new Date(), -1)}
                        className="rounded-md border shadow-sm p-4"
                    />
                </CardContent>
            </Card>

            {/* Time Slot Section */}
            <Card className="md:col-span-7 border-0 shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Available Slots
                    </CardTitle>
                    <CardDescription>
                        {date ? format(date, "EEEE, MMMM do, yyyy") : "Select a date first"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!date ? (
                        <div className="flex items-center justify-center h-[200px] text-slate-400 border-2 border-dashed rounded-xl">
                            Select a date to view slots
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2">
                            {PREDEFINED_SLOTS.map((slot) => (
                                <Button
                                    key={slot.id}
                                    variant={selectedSlot === slot.id ? "default" : "outline"}
                                    className={cn(
                                        "h-14 font-semibold transition-all hover:scale-105",
                                        selectedSlot === slot.id
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 border-indigo-600"
                                            : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                    )}
                                    onClick={() => setSelectedSlot(slot.id)}
                                >
                                    {slot.label}
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <Button
                            size="lg"
                            disabled={!date || !selectedSlot || isSubmitting}
                            onClick={handleBook}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full md:w-auto min-w-[200px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Confirming...
                                </>
                            ) : (
                                "Confirm Booking"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
