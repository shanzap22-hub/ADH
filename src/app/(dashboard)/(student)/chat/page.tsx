import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatPageClient from "@/components/chat/ChatPageClient";

export const metadata = {
    title: "Chat | ADH LMS",
    description: "Connect with your peers",
};

export default async function ChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier, role")
        .eq("id", user.id)
        .single();

    // Check global tier setting
    // We could check `tier_pricing` here too, but for now we enforce via the "Banner" logic in client
    // and assume enabled as per the SQL default.

    return (
        <ChatPageClient
            currentUserId={user.id}
            currentUserTier={profile?.membership_tier || "bronze"}
            currentUserRole={profile?.role || "student"}
        />
    );
}
