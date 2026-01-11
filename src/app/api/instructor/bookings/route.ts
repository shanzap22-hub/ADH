
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch bookings for this instructor
        const { data: bookings, error } = await supabase
            .from("bookings")
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    email
                )
            `)
            .eq("instructor_id", user.id)
            .eq("status", "confirmed");

        if (error) throw error;

        // Manually fetch phone numbers to avoid join errors
        if (bookings && bookings.length > 0) {
            const userIds = bookings.map(b => b.user_id).filter(Boolean);

            // Try fetching all profile data to find the number
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds);

            console.log("Fetched Profiles for Bookings:", profiles);

            // Merge phone numbers
            const phoneMap = new Map();
            if (profiles) {
                profiles.forEach(p => {
                    // Try all possible phone fields
                    const phone = p.contact_number || p.phone || p.mobile || p.phone_number || p.whatsapp_number;
                    if (phone) phoneMap.set(p.id, phone);
                });
            }

            // Update bookings with phone
            const { createAdminClient } = await import("@/lib/supabase/admin");
            const supabaseAdmin = createAdminClient();

            for (const b of bookings) {
                if (b.profiles) {
                    let phone = phoneMap.get(b.user_id);

                    // Fallback to Auth User Metadata if profile phone is missing
                    if (!phone && b.user_id) {
                        try {
                            const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(b.user_id);
                            if (user) {
                                phone = user.phone || user.user_metadata?.phone || user.user_metadata?.mobile || user.user_metadata?.contact_number || user.user_metadata?.whatsapp_number;
                                if (phone) console.log(`Found phone in Auth for user ${b.user_id}: ${phone}`);
                            }
                        } catch (err) {
                            console.error(`Error fetching auth user ${b.user_id}:`, err);
                        }
                    }

                    b.profiles.phone = phone || null;
                }
            }
        }

        return NextResponse.json(bookings);

    } catch (error) {
        console.error("Error fetching bookings:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}
