// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        // Get latest session
        const { data: session } = await (supabase as any)
            .from("weekly_live_sessions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        return NextResponse.json(session || null);
    } catch (error) {
        console.error(error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        // Verify Instructor/Admin
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "instructor" && profile?.role !== "super_admin" && profile?.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();

        // If we have an ID, update it. If not, create new?
        // Actually, if we want "Next Class", maybe we just always maintain ONE active record for simplicity?
        // Or if the user wants to keep history, we insert new.
        // Let's check if an ID was passed. If so update. If not, insert.

        // Calculate End Time
        const duration = parseInt(body.duration_minutes || '60');
        const start = new Date(body.scheduled_at);
        const end = new Date(start.getTime() + duration * 60 * 1000); // Add minutes
        const endTimeStr = end.toISOString();

        let result;
        if (body.id) {
            result = await (supabase as any)
                .from("weekly_live_sessions")
                .update({
                    title: body.title,
                    banner_url: body.banner_url,
                    join_url: body.join_url,
                    scheduled_at: body.scheduled_at,
                    end_time: endTimeStr,
                    updated_at: new Date().toISOString()
                })
                .eq("id", body.id)
                .select()
                .single();
        } else {
            result = await (supabase as any)
                .from("weekly_live_sessions")
                .insert({
                    title: body.title,
                    banner_url: body.banner_url,
                    join_url: body.join_url,
                    scheduled_at: body.scheduled_at,
                    end_time: endTimeStr
                })
                .select()
                .single();
        }

        if (result.error) throw result.error;

        return NextResponse.json(result.data);

    } catch (error) {
        console.error("Error saving session:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
