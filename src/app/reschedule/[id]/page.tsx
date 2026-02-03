'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MetaballLoader } from '@/components/ui/metaball-loader'

export default function ReschedulePage({ params }: { params: { id: string } }) {
    const [booking, setBooking] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Reschedule Logic State
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [availableDates, setAvailableDates] = useState<string[]>([])
    const [slots, setSlots] = useState<string[]>([])
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [isSlotLoading, setIsSlotLoading] = useState(false)
    const [rescheduling, setRescheduling] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    // 1. Fetch Existing Booking
    useEffect(() => {
        const fetchBooking = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, profiles:instructor_id(full_name, avatar_url, id)')
                .eq('id', params.id)
                .single()

            if (error) {
                toast.error("Booking not found")
                router.push('/dashboard')
                return
            }
            setBooking(data)
            setLoading(false)

            // Fetch Availability for this Instructor
            if (data?.instructor_id) {
                fetchAvailability(data.instructor_id)
            }
        }
        fetchBooking()
    }, [params.id])

    const fetchAvailability = async (instructorId: string) => {
        try {
            const res = await fetch(`/api/booking/calendar-availability?instructorId=${instructorId}`)
            if (res.ok) {
                const dates = await res.json()
                setAvailableDates(dates)
            }
        } catch (e) { console.error(e) }
    }

    // 2. Fetch Slots when Date matches
    useEffect(() => {
        if (!booking?.instructor_id || !date) return

        const fetchSlots = async () => {
            setIsSlotLoading(true)
            setSlots([])
            setSelectedSlot(null)

            const offset = date.getTimezoneOffset()
            const localDate = new Date(date.getTime() - (offset * 60 * 1000))
            const dateStr = localDate.toISOString().split('T')[0]

            try {
                const res = await fetch(`/api/booking/slots?instructorId=${booking.instructor_id}&date=${dateStr}`)
                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data)) setSlots(data)
                }
            } catch (e) { console.error(e) }
            finally { setIsSlotLoading(false) }
        }
        fetchSlots()
    }, [date, booking])

    const handleReschedule = async () => {
        if (!date || !selectedSlot) return

        setRescheduling(true)
        try {
            const offset = date.getTimezoneOffset()
            const localDate = new Date(date.getTime() - (offset * 60 * 1000))
            const dateStr = localDate.toISOString().split('T')[0]

            const res = await fetch('/api/booking/reschedule', {
                method: 'POST',
                body: JSON.stringify({
                    id: booking.id,
                    newDate: dateStr,
                    newTime: selectedSlot,
                    instructorId: booking.instructor_id
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Reschedule Failed")

            toast.success("Rescheduled Successfully!")
            router.push('/dashboard') // Or show success state

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setRescheduling(false)
        }
    }

    // Use MetaballLoader instead of Loader2
    if (loading) return <MetaballLoader fullscreen />
    if (!booking) return <div>Booking not found</div>

    return (
        <div className="container mx-auto py-10 max-w-4xl px-4">
            {/* Show Overlay Loader when rescheduling */}
            {rescheduling && <MetaballLoader fullscreen />}

            <h1 className="text-3xl font-bold mb-8">Reschedule Session</h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left: Current Booking Info */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Booking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={booking.profiles?.avatar_url} />
                                    <AvatarFallback>{booking.profiles?.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{booking.profiles?.full_name}</p>
                                    <p className="text-xs text-muted-foreground">Instructor</p>
                                </div>
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <CalendarIcon className="w-4 h-4 text-purple-600" />
                                    <span>{format(new Date(booking.start_time), 'PPP')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                    <span>{format(new Date(booking.start_time), 'p')}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Picker */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            {!date ? (
                                <CardTitle>Select New Date & Time</CardTitle>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setDate(undefined); setSlots([]); setSelectedSlot(null); }} className="-ml-2">← Back</Button>
                                    <CardTitle>{format(date, "EEE, MMM do")}</CardTitle>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!date ? (
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
                                        className="rounded-md border shadow-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
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
                                        className="w-full h-12 text-lg"
                                        disabled={!selectedSlot || rescheduling}
                                        onClick={handleReschedule}
                                    >
                                        {/* Keep Button Spinner intact if preferred, but Overlay covers it */}
                                        {rescheduling ? <Loader2 className="animate-spin mr-2" /> : "Confirm Reschedule"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
