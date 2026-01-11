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

        const { userId } = await req.json();

        // Use Admin Client to bypass RLS for deleting user
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient();

        // Delete from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) throw authError;

        // Note: Deleting from Auth usually cascades to public tables if set up correctly.
        // If not, we should manually delete from profiles. We'll attempt it just in case.
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            console.log("Profile delete info (might be already deleted by cascade):", profileError.message);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete User Error:", error);
        return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
    }
}
