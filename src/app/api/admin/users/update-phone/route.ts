import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Check Admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profile?.role !== "super_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { userId, phone } = await req.json();

        // Use Admin Client to bypass RLS for updating another user's profile
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient();

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { phone: phone }
        });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Update Phone Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update phone" }, { status: 500 });
    }
}
