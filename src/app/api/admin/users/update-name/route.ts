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

        const { userId, fullName } = await req.json();

        // Use Admin Client to bypass RLS
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient();

        // 1. Update Auth Metadata
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        // 2. Update Profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ full_name: fullName })
            .eq("id", userId);

        if (profileError) {
            console.error("Failed to update profile name:", profileError);
            throw profileError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Update Name Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update name" }, { status: 500 });
    }
}
