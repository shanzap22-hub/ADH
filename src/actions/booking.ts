"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBooking(date: Date, notes: string = "") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "You must be logged in to book a session." };
    }

    // Check if slot is taken (Basic check)
    // In a real app, strict overlap checking is needed
    // For now, allow overlapping bookings for implementation speed, or strict unique constraint?
    // Let's assume frontend filters slots.

    // Calculate End Time (1 hour session)
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

    const { data, error } = await supabase
        .from("mentorship_bookings")
        .insert({
            user_id: user.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "pending", // Pending until Auto-Confirm or Admin approves
            notes: notes
        })
        .select()
        .single();

    if (error) {
        console.error("Booking Error:", error);
        return { error: "Failed to book session. Please try again." };
    }

    // TODO: Google Calendar Sync Logic Here
    // TODO: Email Notification Logic Here

    revalidatePath("/book-session");
    return { success: true, booking: data };
}

export async function getUserBookings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data } = await supabase
        .from("mentorship_bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });

    return data || [];
}
