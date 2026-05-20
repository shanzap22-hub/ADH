import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
    try {
        // 1. Authenticate
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2. Check admin role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "admin" && profile?.role !== "super_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 3. Read params
        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get("student_id");
        const startDate = searchParams.get("start_date");
        const endDate = searchParams.get("end_date");

        if (!studentId || !startDate || !endDate) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 4. Fetch logs using Admin client (bypasses RLS)
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from("user_daily_ritual_logs")
            .select("completed_date, ritual_id")
            .eq("user_id", studentId)
            .gte("completed_date", startDate)
            .lte("completed_date", endDate);

        if (error) {
            console.error("Calendar logs error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ logs: data || [] });
    } catch (e: any) {
        console.error("Calendar API error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
