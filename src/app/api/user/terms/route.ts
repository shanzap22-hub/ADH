import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { type } = body;

        let updateData = {};
        if (type === 'ai') {
            updateData = { terms_ai_accepted: true };
        } else if (type === 'community') {
            updateData = { terms_community_accepted: true };
        } else {
            return new NextResponse("Invalid term type", { status: 400 });
        }

        const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", user.id);

        if (error) {
            console.error("Error updating terms:", error);
            return new NextResponse("Database Error", { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Terms Update Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
