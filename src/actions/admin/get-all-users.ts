import { createClient } from "@/lib/supabase/server";

export async function getAllUsers() {
    const supabase = await createClient();

    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[GET_ALL_USERS] Error:', error);
        return [];
    }

    // Use Admin Client to fetch auth users to get phone numbers from metadata
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin = createAdminClient();

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (authError) {
        console.error('[GET_ALL_USERS] Auth Error:', authError);
    }

    // Create a map of auth users for faster lookup
    const authUserMap = new Map(authUsers?.users.map(u => [u.id, u]) || []);

    return users.map(user => ({
        ...user,
        phone: authUserMap.get(user.id)?.user_metadata?.phone || null
    }));
}
