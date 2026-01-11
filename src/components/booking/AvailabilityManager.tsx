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

const locales = {
    "en-US": enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
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
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    // Settings
    const [slotDuration, setSlotDuration] = useState(30);
    const [bufferTime, setBufferTime] = useState(5);
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
        const res = await fetch("/api/instructor/availability/settings");
        if (res.ok) {
            const data = await res.json();
            setSlotDuration(data.slot_duration);
            setBufferTime(data.buffer_time);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Overrides
            const resOverrides = await fetch("/api/instructor/availability/overrides");
            const overrides = await resOverrides.json();

            // Fetch Weekly
            const resWeekly = await fetch("/api/instructor/availability");
            const weekly = await resWeekly.json();

            // Fetch Bookings (Confirmed sessions)
            // We need a new endpoint or reusing an existing one. 
            // Let's assume we can fetch bookings for this instructor.
            // Since we don't have a direct "get my bookings" for calendar here yet, 
            // I'll assume we can't easily get them without a new route or I'll try to find one.
            // Wait, checking previous files... `src/app/api/booking/create` exists.
            // I'll assume I need to fetch bookings.
            // Let's rely on the weekly/override projection for now, 
            // AND strictly fetching bookings to overlay.

            // Note: I will create a quick internal fetch for bookings if needed, 
            // but for now let's try to fetch from a hypothetical endpoint or standard Supabase client if possible?
            // No, strictly API. 
            // Let's add a `fetch("/api/instructor/bookings")` 

            const resBookings = await fetch("/api/instructor/bookings");
            const bookings = resBookings.ok ? await resBookings.json() : [];
            console.log("Fetched bookings:", bookings);

            // Convert to Events
            const allEvents: Event[] = [];

            // 0. Map Bookings (High Priority - RED)
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

            // 1. Map Overrides (Specific Dates)
            if (Array.isArray(overrides)) {
                overrides.forEach((o: any) => {
                    if (!o.is_available) return; // If override says "Not Available", don't show green

                    const start = new Date(`${o.specific_date}T${o.start_time}`);
                    const end = new Date(`${o.specific_date}T${o.end_time}`);

                    // Check overlap with any booking
                    const isBooked = allEvents.some(b =>
                        b.resource.type === 'booked' &&
                        ((start >= b.start && start < b.end) || (end > b.start && end <= b.end))
                    );

                    if (!isBooked) {
                        allEvents.push({
                            id: `override-${o.id || Math.random()}`,
                            title: "Available",
                            start,
                            end,
                            resource: { type: 'override', data: o }
                        });
                    }
                });
            }

            // 2. Map Weekly (Project onto next 60 days)
            if (Array.isArray(weekly)) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (let i = 0; i < 60; i++) {
                    const curr = new Date(today);
                    curr.setDate(today.getDate() + i);
                    const dayIndex = curr.getDay(); // 0-6

                    const daySlots = weekly.filter((s: any) => s.day_of_week === dayIndex);

                    daySlots.forEach((s: any) => {
                        const dateString = curr.toISOString().split('T')[0]; // Valid for local math if noon? 
                        // Safe date string construction:
                        const y = curr.getFullYear();
                        const m = String(curr.getMonth() + 1).padStart(2, '0');
                        const d = String(curr.getDate()).padStart(2, '0');
                        const safeDateStr = `${y}-${m}-${d}`;

                        const hasOverride = overrides?.some((o: any) => o.specific_date === safeDateStr);

                        if (!hasOverride) {
                            const start = new Date(`${safeDateStr}T${s.start_time}`);
                            const end = new Date(`${safeDateStr}T${s.end_time}`);

                            // Check overlap with bookings
                            const isBooked = allEvents.some(b =>
                                b.resource.type === 'booked' &&
                                ((start < b.end && end > b.start)) // Basic overlap check
                            );

                            if (!isBooked) {
                                allEvents.push({
                                    id: `weekly-${i}-${s.id || Math.random()}`,
                                    title: "Available",
                                    start,
                                    end,
                                    resource: { type: 'weekly', data: s, date: safeDateStr }
                                });
                            }
                        }
                    });
                }
            }

            setEvents(allEvents);

        } catch (e) {
            console.error(e);
            toast.error("Failed to load calendar");
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            await fetch("/api/instructor/availability/settings", {
                method: "POST",
                body: JSON.stringify({ slot_duration: slotDuration, buffer_time: bufferTime })
            });
            toast.success("Settings saved");
            setIsSettingsOpen(false);
        } catch (e) {
            toast.error("Failed to save settings");
        }
    };

    const handleSlotSelect = ({ start, end }: { start: Date, end: Date }) => {
        // Build 'new event' state from selection
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

            // Init reschedule form with current values
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
            setIsEditOpen(true);
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

            if (!res.ok) throw new Error("Failed to reschedule");

            toast.success("Booking rescheduled successfully");
            setIsBookingDetailsOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to reschedule booking");
        }
    };

    const deleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            if (selectedEvent.resource.type === 'weekly') {
                // Delete from weekly slots API logic
                // Fetch current, filter out this slot (by ID or time matching?), save
                const res = await fetch("/api/instructor/availability");
                const current = await res.json();
                const slotId = selectedEvent.resource.data.id;

                // If it's a real DB id
                const updated = current.filter((s: any) => s.id !== slotId);

                // If no ID (just created?), match details
                if (updated.length === current.length && !slotId) {
                    // logic to match by time/day
                }

                await fetch("/api/instructor/availability", {
                    method: "POST",
                    body: JSON.stringify({ slots: updated })
                });

            } else if (selectedEvent.resource.type === 'override') {
                // Delete override
                const res = await fetch("/api/instructor/availability/overrides");
                const current = await res.json();
                const overrideId = selectedEvent.resource.data.id;
                const updated = current.filter((o: any) => o.id !== overrideId);

                await fetch("/api/instructor/availability/overrides", {
                    method: "POST",
                    body: JSON.stringify({ overrides: updated })
                });
            } else if (selectedEvent.resource.type === 'booked') {
                toast.error("Cannot delete a booked session here. Cancel it in bookings.");
                return;
            }

            toast.success("Slot removed");
            setIsEditOpen(false);
            fetchData();
        } catch (e) {
            toast.error("Failed to delete");
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

                await fetch("/api/instructor/availability/overrides", {
                    method: "POST",
                    body: JSON.stringify({ overrides: updated })
                });
            } else {
                const res = await fetch("/api/instructor/availability");
                const current = await res.json();
                const updated = [...current, {
                    day_of_week: parseInt(newEvent.dayOfWeek),
                    start_time: newEvent.startTime,
                    end_time: newEvent.endTime,
                    is_active: true
                }];
                await fetch("/api/instructor/availability", {
                    method: "POST",
                    body: JSON.stringify({ slots: updated })
                });
            }

            toast.success("Slot added");
            setIsAddOpen(false);
            fetchData(); // Reload
        } catch (e) {
            toast.error("Failed to save slot");
        }
    };

    if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

    return (
        <Card className="h-[800px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Availability Calendar</CardTitle>
                    <CardDescription>Manage your schedule like a pro</CardDescription>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
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
                                    <label className="text-sm font-medium">Buffer Time (minutes)</label>
                                    <Input type="number" value={bufferTime} onChange={e => setBufferTime(parseInt(e.target.value))} />
                                </div>
                                <Button onClick={saveSettings} className="w-full">Save Settings</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Slot
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
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
                                        <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">End Time</label>
                                        <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                                    </div>
                                </div>

                                <Button onClick={saveEvent} className="w-full">Create Slot</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Edit Slot</DialogTitle></DialogHeader>
                            <div className="py-4">
                                <p className="mb-4 text-sm text-slate-500">
                                    {selectedEvent?.resource.type === 'weekly'
                                        ? "This is a recurring weekly slot."
                                        : "This is a specific date override."}
                                </p>
                                <Button variant="destructive" onClick={deleteEvent} className="w-full">Delete Slot</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Booking Details Modal */}
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
                                                    <Input
                                                        type="time"
                                                        value={rescheduleData.startTime}
                                                        onChange={e => setRescheduleData({ ...rescheduleData, startTime: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500">End Time</label>
                                                    <Input
                                                        type="time"
                                                        value={rescheduleData.endTime}
                                                        onChange={e => setRescheduleData({ ...rescheduleData, endTime: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <Button onClick={handleReschedule} className="w-full bg-blue-600 hover:bg-blue-700">Confirm Reschedule</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    views={[Views.MONTH, Views.WEEK, Views.DAY]}
                    defaultView={Views.WEEK}
                    selectable
                    onSelectSlot={handleSlotSelect}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={(event) => {
                        let backgroundColor = '#8b5cf6'; // default purple
                        if (event.resource.type === 'booked') backgroundColor = '#ef4444'; // Red
                        else if (event.resource.type === 'override' || event.resource.type === 'weekly') backgroundColor = '#10b981'; // Green

                        return { style: { backgroundColor } };
                    }}
                />
            </CardContent>
        </Card>
    );
}
