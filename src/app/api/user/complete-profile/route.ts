import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
    try {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
            return NextResponse.json({ error: "Server Configuration Error: Missing Admin Key" }, { status: 500 });
        }

        const supabase = await createClient();
        const body = await request.json();
        const { fullName, contactNumber, whatsappNumber, password, sameAsContact } = body;

        // Verify User
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Auth Error", userError);
            return NextResponse.json({ error: "Unauthorized: Please login again" }, { status: 401 });
        }

        if (!fullName || !contactNumber) {
            return NextResponse.json(
                { error: "Name and Contact Number are required" },
                { status: 400 }
            );
        }

        // Use Admin Client to bypass RLS for Profile Update
        const supabaseAdmin = createAdminClient();

        // 1. Update Profile (Upsert to be safe)
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .upsert({
                id: user.id,
                full_name: fullName,
                phone_number: contactNumber,
                whatsapp_number: whatsappNumber || contactNumber,
                updated_at: new Date().toISOString(),
                email: user.email // Ensure email is set if creating
            });

        if (profileError) {
            console.error("Profile Update Error", profileError);
            return NextResponse.json({ error: `Profile Error: ${profileError.message}` }, { status: 500 });
        }

        // 2. Update Auth (Password & Clear Flag)
        const updateData: any = {
            data: { setup_required: false, full_name: fullName }
        };

        // Only update password if provided and not skipped
        if (password && password !== "SKIPPED" && password.length >= 6) {
            updateData.password = password;
        }

        const { error: authError } = await supabase.auth.updateUser(updateData);

        if (authError) {
            console.error("Auth Update Error", authError);
            return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Complete Profile Error", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
