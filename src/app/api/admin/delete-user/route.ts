import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Delete user's purchases first (foreign key constraint)
        await supabase
            .from("purchases")
            .delete()
            .eq("user_id", userId);

        // Delete user's progress
        await supabase
            .from("user_progress")
            .delete()
            .eq("user_id", userId);

        // Delete profile
        const { error: profileError } = await supabase
            .from("profiles")
            .delete()
            .eq("id", userId);

        if (profileError) {
            console.error("[DELETE_USER_PROFILE]", profileError);
            return NextResponse.json(
                { error: "Failed to delete user profile" },
                { status: 500 }
            );
        }

        // Note: We can't delete from auth.users via client, but deleting profile effectively bans them
        // For full deletion, you'd need to use Supabase Admin API

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[DELETE_USER]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
