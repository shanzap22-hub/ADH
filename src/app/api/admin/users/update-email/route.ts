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

        const { userId, email } = await req.json();

        // Use Admin Client to bypass RLS for updating another user's profile
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabaseAdmin = createAdminClient();

        // 1. Update Auth Email
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: email,
            email_confirm: true // Auto-confirm the new email
        });

        if (authError) throw authError;

        // 2. Update Profile Email
        // Technically triggers on Auth update if configured but good to be explicit
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ email: email })
            .eq("id", userId);

        if (profileError) {
            console.error("Failed to update profile email:", profileError);
            // We continue because Auth is the source of truth, but this is bad.
            // Usually auth update triggers a trigger to update public.users/profiles
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Update Email Error:", error);
        return NextResponse.json({ error: error.message || "Failed to update email" }, { status: 500 });
    }
}
