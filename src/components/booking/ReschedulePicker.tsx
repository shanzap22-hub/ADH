"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ReschedulePickerProps {
    booking: any;
    onSuccess?: () => void;
}

export function ReschedulePicker({ booking, onSuccess }: ReschedulePickerProps) {
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSlotLoading, setIsSlotLoading] = useState(false);
    const [rescheduling, setRescheduling] = useState(false);

    // 1. Fetch Availability
    useEffect(() => {
        if (booking?.instructor_id) {
            const fetchAvailability = async () => {
                try {
                    const res = await fetch(`/api/booking/calendar-availability?instructorId=${booking.instructor_id}`);
                    if (res.ok) {
                        const dates = await res.json();
                        setAvailableDates(dates);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            fetchAvailability();
        }
    }, [booking]);

    // 2. Fetch Slots
    useEffect(() => {
        if (!booking?.instructor_id || !date) return;

        const fetchSlots = async () => {
            setIsSlotLoading(true);
            setSlots([]);
            setSelectedSlot(null);

            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            try {
                const res = await fetch(`/api/booking/slots?instructorId=${booking.instructor_id}&date=${dateStr}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setSlots(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsSlotLoading(false);
            }
        };
        fetchSlots();
    }, [date, booking]);

    const handleReschedule = async () => {
        if (!date || !selectedSlot) return;

        setRescheduling(true);
        try {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            const dateStr = localDate.toISOString().split('T')[0];

            const res = await fetch('/api/booking/reschedule', {
                method: 'POST',
                body: JSON.stringify({
                    id: booking.id,
                    newDate: dateStr,
                    newTime: selectedSlot,
                    instructorId: booking.instructor_id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reschedule Failed");

            toast.success("Rescheduled Successfully!");
            if (onSuccess) onSuccess();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setRescheduling(false);
        }
    };

    if (!date) {
        return (
            <div className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = d < today;
                        const isTooFar = d > addDays(new Date(), 30);
                        const dStr = format(d, 'yyyy-MM-dd');
                        const isUnavailable = availableDates.length > 0 && !availableDates.includes(dStr);
                        return isPast || isTooFar || isUnavailable;
                    }}
                    modifiers={{ available: (d) => availableDates.includes(format(d, 'yyyy-MM-dd')) }}
                    modifiersClassNames={{ available: "bg-green-100 text-green-900 font-bold hover:bg-green-200 rounded-full cursor-pointer relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-500 after:rounded-full" }}
                    className="rounded-md border shadow-sm p-3"
                    classNames={{
                        head_cell: "text-slate-500 font-normal text-[0.8rem] uppercase w-10 h-10 flex items-center justify-center",
                        cell: "h-10 w-10 text-center text-sm p-0 m-0.5 relative [&:has([aria-selected])]:bg-purple-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-full",
                        day_selected: "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white shadow-md",
                        day_today: "bg-slate-100 text-slate-900 font-bold",
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => { setDate(undefined); setSlots([]); setSelectedSlot(null); }} className="-ml-2">← Back to Calendar</Button>
                <span className="font-bold">{format(date, "EEE, MMM do")}</span>
            </div>

            {isSlotLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p>No slots available on this date.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {slots.map((slot) => {
                        const [h, m] = slot.split(':');
                        const dObj = new Date(); dObj.setHours(+h, +m);
                        const label = dObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                        return (
                            <Button
                                key={slot}
                                variant={selectedSlot === slot ? 'default' : 'outline'}
                                className={selectedSlot === slot ? "bg-purple-600 hover:bg-purple-700" : ""}
                                onClick={() => setSelectedSlot(slot)}
                            >
                                {label}
                            </Button>
                        )
                    })}
                </div>
            )}

            <Button
                className="w-full h-12 text-lg bg-black text-white hover:bg-slate-800"
                disabled={!selectedSlot || rescheduling}
                onClick={handleReschedule}
            >
                {rescheduling ? <Loader2 className="animate-spin mr-2" /> : "Confirm Reschedule"}
            </Button>
        </div>
    );
}
