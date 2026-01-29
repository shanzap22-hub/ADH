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

    // 1. Explicitly delete from public.profiles first (Safe guard against missing CASCADE)
    // This ensures data is cleared even if Auth delete fails or is restricted
    const { error: profileError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', user.id);

    if (profileError) {
        console.error("Warning: Profile delete failed (might verify cascade or already gone)", profileError);
        // Continue to auth delete anyway, just in case
    }

    // 2. Delete user from Auth (The Source of Truth)
    const { error } = await adminClient.auth.admin.deleteUser(user.id);

    if (error) {
        console.error("Error deleting user:", error);
        throw new Error(error.message);
    }

    return { success: true };
}
