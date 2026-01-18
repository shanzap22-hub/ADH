"use client";

import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Settings, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ConnectCalendarButton from "@/components/instructor/ConnectCalendarButton"; // Import Button

const TIME_OPTIONS: { label: string; value: string }[] = [];
for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
        const d = new Date();
        d.setHours(h, m);
        const label = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        TIME_OPTIONS.push({ label, value });
    }
}

const locales = {
    "en-US": enUS,
};

// Dynamic Start of Week (Starts Today)
const startOfWeekDynamic = (date: Date) => {
    const todayIndex = new Date().getDay();
    return startOfWeek(date, { weekStartsOn: todayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6 });
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: startOfWeekDynamic,
    getDay,
    locales,
});

interface Event {
    id: string; // unique ID
    title: string;
    start: Date;
    end: Date;
    resource?: any; // To store type (weekly/specific)
    allDay?: boolean;
}

export function AvailabilityManager() {
    // 1. All State Definitions
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false); // For action buttons

    // Calendar Control State (Persist View)
    const [view, setView] = useState(Views.WEEK);
    const [date, setDate] = useState(new Date());

    // Settings
    const [slotDuration, setSlotDuration] = useState(30);
    const [bufferTime, setBufferTime] = useState(5);
    const [minRequestTime, setMinRequestTime] = useState(60); // Default 60 mins notice
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Event Modal
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        type: "specific", // specific | weekly
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        dayOfWeek: "1" // 1=Mon
    });

    // State for Edit/Delete Dialog
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Editing Slot Data
    const [editSlotData, setEditSlotData] = useState({
        startTime: "",
        endTime: "",
        date: "" // meaningful for overrides
    });

    // Booking Details Modal State
    const [isBookingDetailsOpen, setIsBookingDetailsOpen] = useState(false);
    const [bookingDetails, setBookingDetails] = useState<any>(null);
    const [rescheduleData, setRescheduleData] = useState({
        date: "",
        startTime: "",
        endTime: ""
    });

    useEffect(() => {
        fetchData();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/instructor/availability/settings");
            if (res.ok) {
                const data = await res.json();
                setSlotDuration(data.slot_duration);
                setBufferTime(data.buffer_time);
                setMinRequestTime(data.min_notice_time || 60);
            }
        } catch (e) { console.error("Settings fetch error", e); }
    };

    const fetchData = async (background = false) => {
        if (!background) setLoading(true);
        try {
            const [resOverrides, resWeekly, resBookings] = await Promise.all([
                fetch("/api/instructor/availability/overrides"),
                fetch("/api/instructor/availability"),
                fetch("/api/instructor/bookings")
            ]);

            const overrides = await resOverrides.json();
            const weekly = await resWeekly.json();
            const bookings = resBookings.ok ? await resBookings.json() : [];

            const allEvents: Event[] = [];

            // 0. Map Bookings
            if (Array.isArray(bookings)) {
                bookings.forEach((b: any) => {
                    allEvents.push({
                        id: `booking-${b.id}`,
                        title: `Booked: ${b.profiles?.full_name || 'Student'}`,
                        start: new Date(b.start_time),
                        end: new Date(b.end_time),
                        resource: { type: 'booked', data: b }
                    });
                });
            }

            // 1. Map Overrides
            if (Array.isArray(overrides)) {
                overrides.forEach((o: any) => {
                    if (o.is_available) {
                        allEvents.push({
                            id: `override-${o.id}`,
                            title: "Available (Override)",
                            start: new Date(`${o.specific_date}T${o.start_time}`),
                            end: new Date(`${o.specific_date}T${o.end_time}`),
                            resource: { type: 'override', data: o }
                        });
                    }
                });
            }

            // 2. Map Weekly (Generative)
            if (Array.isArray(weekly)) {
                const startGen = new Date();
                startGen.setDate(startGen.getDate() - 30); // Look back 30 days
                startGen.setHours(0, 0, 0, 0);

                for (let i = 0; i < 90; i++) { // Look forward 90 days from -30
                    const curr = new Date(startGen);
                    curr.setDate(startGen.getDate() + i);
                    const dayIndex = curr.getDay();
                    const dateStr = format(curr, 'yyyy-MM-dd');

                    // Check overrides
                    if (overrides?.some((o: any) => o.specific_date === dateStr)) continue;

                    const daySlots = weekly.filter((s: any) => s.day_of_week === dayIndex);
                    daySlots.forEach((s: any) => {
                        allEvents.push({
                            id: `weekly-${i}-${s.id}`,
                            title: "Available",
                            start: new Date(`${dateStr}T${s.start_time}`),
                            end: new Date(`${dateStr}T${s.end_time}`),
                            resource: { type: 'weekly', data: s, date: dateStr }
                        });
                    });
                }
            }

            setEvents(allEvents);
        } catch (e) {
            console.error(e);
            toast.error("Failed to sync calendar");
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = () => {
        fetchData(true); // Background refresh
        setIsAddOpen(false);
        setIsEditOpen(false);
        setIsBookingDetailsOpen(false);
    };

    const saveSettings = async () => {
        try {
            await fetch("/api/instructor/availability/settings", {
                method: "POST",
                body: JSON.stringify({
                    slot_duration: slotDuration,
                    buffer_time: bufferTime,
                    min_notice_time: minRequestTime
                })
            });
            toast.success("Settings saved");
            setIsSettingsOpen(false);
        } catch (e) {
            toast.error("Failed to save settings");
        }
    };

    const handleSlotSelect = ({ start, end }: { start: Date, end: Date }) => {
        setNewEvent({
            ...newEvent,
            date: start.toISOString().split('T')[0],
            startTime: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            endTime: end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            type: 'specific'
        });
        setIsAddOpen(true);
    };

    const handleSelectEvent = (event: Event) => {
        if (event.resource.type === 'booked') {
            const booking = event.resource.data;
            setBookingDetails(booking);
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);
            setRescheduleData({
                date: start.toISOString().split('T')[0],
                startTime: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                endTime: end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            });
            setIsBookingDetailsOpen(true);
        } else {
            setSelectedEvent(event);
            const start = event.start;
            const end = event.end;
            setEditSlotData({
                startTime: start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                endTime: end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                date: start.toISOString().split('T')[0]
            });
            setIsEditOpen(true);
        }
    };

    const handleCancelBooking = async () => {
        if (!bookingDetails) return;
        if (!confirm("Are you sure you want to delete/cancel this booking? This cannot be undone.")) return;

        try {
            const res = await fetch("/api/booking/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookingId: bookingDetails.id })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Booking deleted/cancelled successfully");
            handleSuccess();
        } catch (error) {
            toast.error("Failed to delete booking");
        }
    };

    const handleReschedule = async () => {
        if (!bookingDetails || !rescheduleData.date || !rescheduleData.startTime || !rescheduleData.endTime) return;

        try {
            const res = await fetch("/api/booking/reschedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: bookingDetails.id,
                    newDate: rescheduleData.date,
                    newStartTime: rescheduleData.startTime,
                    newEndTime: rescheduleData.endTime
                })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Booking rescheduled successfully");
            handleSuccess();
        } catch (error) {
            toast.error("Failed to reschedule booking");
        }
    };

    const deleteEvent = async () => {
        if (!selectedEvent) return;
        try {
            if (selectedEvent.resource.type === 'weekly') {
                const res = await fetch("/api/instructor/availability");
                const current = await res.json();
                const slotId = selectedEvent.resource.data.id;
                const updated = current.filter((s: any) => s.id !== slotId);
                await fetch("/api/instructor/availability", { method: "POST", body: JSON.stringify({ slots: updated }) });

            } else if (selectedEvent.resource.type === 'override') {
                const res = await fetch("/api/instructor/availability/overrides");
                const current = await res.json();
                const overrideId = selectedEvent.resource.data.id;
                const updated = current.filter((o: any) => o.id !== overrideId);
                await fetch("/api/instructor/availability/overrides", { method: "POST", body: JSON.stringify({ overrides: updated }) });
            }
            toast.success("Slot removed");
            handleSuccess();
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleUpdateAvailability = async () => {
        if (!selectedEvent) return;
        try {
            if (selectedEvent.resource.type === 'weekly') {
                const res = await fetch("/api/instructor/availability");
                const current = await res.json();
                const slotId = selectedEvent.resource.data.id;
                const updated = current.map((s: any) => {
                    if (s.id === slotId) return { ...s, start_time: editSlotData.startTime, end_time: editSlotData.endTime };
                    return s;
                });
                await fetch("/api/instructor/availability", { method: "POST", body: JSON.stringify({ slots: updated }) });

            } else if (selectedEvent.resource.type === 'override') {
                const res = await fetch("/api/instructor/availability/overrides");
                const current = await res.json();
                const overrideId = selectedEvent.resource.data.id;
                const updated = current.map((o: any) => {
                    if (o.id === overrideId) return { ...o, start_time: editSlotData.startTime, end_time: editSlotData.endTime, specific_date: editSlotData.date };
                    return o;
                });
                await fetch("/api/instructor/availability/overrides", { method: "POST", body: JSON.stringify({ overrides: updated }) });
            }
            toast.success("Slot updated successfully");
            handleSuccess();
        } catch (e) {
            toast.error("Failed to update slot");
        }
    };

    const saveEvent = async () => {
        try {
            if (newEvent.type === 'specific') {
                const res = await fetch("/api/instructor/availability/overrides");
                const current = await res.json();
                const updated = [...current, {
                    specific_date: newEvent.date,
                    start_time: newEvent.startTime,
                    end_time: newEvent.endTime,
                    is_available: true
                }];
                await fetch("/api/instructor/availability/overrides", { method: "POST", body: JSON.stringify({ overrides: updated }) });
            } else {
                const res = await fetch("/api/instructor/availability");
                const current = await res.json();
                const updated = [...current, {
                    day_of_week: parseInt(newEvent.dayOfWeek),
                    start_time: newEvent.startTime,
                    end_time: newEvent.endTime,
                    is_active: true
                }];
                await fetch("/api/instructor/availability", { method: "POST", body: JSON.stringify({ slots: updated }) });
            }
            toast.success("Slot added");
            handleSuccess();
        } catch (e) {
            toast.error("Failed to save slot");
        }
    };

    return (
        <Card className="h-[850px] flex flex-col shadow-none border-0 bg-white dark:bg-slate-950">
            <style jsx global>{`
                .rbc-current-time-indicator {
                    height: 2px !important;
                    background-color: #10b981 !important;
                }
                .rbc-time-view { border-top: none !important; border-left: none !important; border-right: none !important; }
                .rbc-time-header.rbc-overflowing { border-right: none !important; }
            `}</style>
            <CardHeader className="flex flex-row items-center justify-between border-b px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">Availability</CardTitle>
                </div>
                <div className="flex gap-2 items-center">
                    <ConnectCalendarButton />
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-200">
                                <Settings className="w-4 h-4 text-slate-600" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Booking Settings</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium">Slot Duration (minutes)</label>
                                    <Input type="number" value={slotDuration} onChange={e => setSlotDuration(parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Buffer Time Between Slots (minutes)</label>
                                    <Input type="number" value={bufferTime} onChange={e => setBufferTime(parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Minimum Notice (minutes)</label>
                                    <p className="text-xs text-slate-500 mb-1">How much time in advance must a student book?</p>
                                    <Input type="number" value={minRequestTime} onChange={e => setMinRequestTime(parseInt(e.target.value))} />
                                </div>
                                <Button onClick={saveSettings} className="w-full">Save Settings</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-9 bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all hover:scale-105">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Slot
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>Add Availability</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium">Repeat</label>
                                    <Select value={newEvent.type} onValueChange={v => setNewEvent({ ...newEvent, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="specific">Does not repeat (Specific Date)</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newEvent.type === 'specific' ? (
                                    <div>
                                        <label className="text-sm font-medium">Date</label>
                                        <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-sm font-medium">Every</label>
                                        <Select value={newEvent.dayOfWeek} onValueChange={v => setNewEvent({ ...newEvent, dayOfWeek: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d, i) => (
                                                    <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Start Time</label>
                                        <Select value={newEvent.startTime} onValueChange={v => setNewEvent({ ...newEvent, startTime: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                                            <SelectContent className="h-[200px]">
                                                {TIME_OPTIONS.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">End Time</label>
                                        <Select value={newEvent.endTime} onValueChange={v => setNewEvent({ ...newEvent, endTime: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                                            <SelectContent className="h-[200px]">
                                                {TIME_OPTIONS.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button onClick={saveEvent} className="w-full">Create Slot</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Edit Slot</DialogTitle></DialogHeader>
                            <div className="py-4 space-y-4">
                                <p className="text-sm text-slate-500">
                                    {selectedEvent?.resource.type === 'weekly'
                                        ? "Editing Weekly Recurring Slot"
                                        : "Editing Specific Date Override"}
                                </p>
                                {selectedEvent?.resource.type === 'override' && (
                                    <div>
                                        <label className="text-sm font-medium">Date</label>
                                        <Input type="date" value={editSlotData.date} onChange={e => setEditSlotData({ ...editSlotData, date: e.target.value })} />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Start Time</label>
                                        <Select value={editSlotData.startTime} onValueChange={v => setEditSlotData({ ...editSlotData, startTime: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                                            <SelectContent className="h-[200px]">
                                                {TIME_OPTIONS.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">End Time</label>
                                        <Select value={editSlotData.endTime} onValueChange={v => setEditSlotData({ ...editSlotData, endTime: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                                            <SelectContent className="h-[200px]">
                                                {TIME_OPTIONS.map((t) => (
                                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="default" onClick={handleUpdateAvailability} className="flex-1 bg-green-600 hover:bg-green-700">Update Slot</Button>
                                    <Button variant="destructive" onClick={deleteEvent} className="flex-1">Delete Slot</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isBookingDetailsOpen} onOpenChange={setIsBookingDetailsOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
                            {bookingDetails && (
                                <div className="py-4 space-y-4">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2 text-sm">
                                        <p><span className="font-semibold">Student:</span> {bookingDetails.profiles?.full_name}</p>
                                        <p><span className="font-semibold">Email:</span> {bookingDetails.profiles?.email}</p>
                                        <p><span className="font-semibold">Phone:</span> {bookingDetails.profiles?.phone || "N/A"}</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium mb-3">Reschedule Session</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-slate-500">New Date</label>
                                                <Input
                                                    type="date"
                                                    value={rescheduleData.date}
                                                    onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-slate-500">Start Time</label>
                                                    <Select value={rescheduleData.startTime} onValueChange={v => setRescheduleData({ ...rescheduleData, startTime: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                                                        <SelectContent className="h-[200px]">
                                                            {TIME_OPTIONS.map((t) => (
                                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500">End Time</label>
                                                    <Select value={rescheduleData.endTime} onValueChange={v => setRescheduleData({ ...rescheduleData, endTime: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                                                        <SelectContent className="h-[200px]">
                                                            {TIME_OPTIONS.map((t) => (
                                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button onClick={handleReschedule} className="w-full bg-blue-600 hover:bg-blue-700">Confirm Reschedule</Button>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <Button variant="destructive" onClick={handleCancelBooking} className="w-full">
                                            Delete / Cancel Booking
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="animate-spin w-8 h-8 text-purple-600" />
                    </div>
                )}
                <div className="h-full p-4">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        views={[Views.MONTH, Views.WEEK, Views.DAY]}

                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={setDate}

                        formats={{
                            timeGutterFormat: 'h:mm a',
                            eventTimeRangeFormat: ({ start, end }: any, culture: any, local) =>
                                `${local.format(start, 'h:mm a', culture)} - ${local.format(end, 'h:mm a', culture)}`,
                        }}

                        selectable
                        onSelectSlot={handleSlotSelect}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={(event) => {
                            let backgroundColor = '#8b5cf6';
                            if (event.resource.type === 'booked') backgroundColor = '#ef4444';
                            else if (event.resource.type === 'override' || event.resource.type === 'weekly') backgroundColor = '#10b981';

                            return { style: { backgroundColor, borderRadius: '6px', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } };
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
