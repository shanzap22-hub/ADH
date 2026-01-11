import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        // Fetch profiles with instructor or super_admin role
        const { data: instructors } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("role", ["instructor", "super_admin"]);

        return NextResponse.json(instructors || []);
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}
