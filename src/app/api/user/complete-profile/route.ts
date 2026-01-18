import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { fullName, contactNumber, whatsappNumber, password } = body;

        if (!fullName || !contactNumber) {
            return NextResponse.json(
                { error: "Name and Contact Number are required" },
                { status: 400 }
            );
        }

        // 1. Update Profile FIRST
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: fullName,
                phone_number: contactNumber,
                whatsapp_number: whatsappNumber || contactNumber,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (profileError) {
            console.error("Profile Update Error", profileError);
            return NextResponse.json({ error: "Failed to update profile details." }, { status: 500 });
        }

        // 2. Update Auth (Password & Clear Flag)
        const updateData: any = {
            data: { setup_required: false, full_name: fullName }
        };

        if (password && password.length >= 6) {
            updateData.password = password;
        }

        const { error: authError } = await supabase.auth.updateUser(updateData);

        if (authError) {
            console.error("Auth Update Error", authError);
            return NextResponse.json({ error: "Failed to set password. Try again." }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Complete Profile Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
