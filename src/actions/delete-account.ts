"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function deleteAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const adminClient = createAdminClient();

    // Delete user from Auth (This cascades to public tables usually if set up correctly, 
    // ensuring complete data removal compliant with Play Store)
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
        console.error("Error deleting user:", error);
        throw new Error(error.message);
    }

    return { success: true };
}
