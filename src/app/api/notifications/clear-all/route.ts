import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date().toISOString();

        const { error } = await supabase
            .from('profiles')
            .update({ notifications_last_cleared_at: now })
            .eq('id', user.id);

        if (error) {
            console.error("Failed to update clear timestamp:", error);
            return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
        }

        return NextResponse.json({ success: true, cleared_at: now });

    } catch (error: any) {
        console.error("Clear Notifications Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
