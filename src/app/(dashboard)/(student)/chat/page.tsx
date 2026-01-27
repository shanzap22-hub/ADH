import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChatPageClient from "@/components/chat/ChatPageClient";

export const metadata = {
    title: "Chat | ADH Connect",
    description: "Connect with your peers",
};

export const dynamic = "force-dynamic";

export default async function ChatPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier, role, terms_ai_accepted, terms_community_accepted")
        .eq("id", user.id)
        .single();

    // Check tier capabilities
    const { data: tierSettings } = await supabase
        .from("tier_pricing")
        .select("has_ai_access")
        .eq("tier", profile?.membership_tier || "free")
        .single();

    const isAdmin =
        profile?.role === "super_admin" ||
        profile?.role === "instructor" ||
        profile?.role === "admin";

    const hasAccess = isAdmin || tierSettings?.has_ai_access === true;

    if (!hasAccess) {
        const { UpgradeTierMessage } = await import("@/components/UpgradeTierMessage");
        return <UpgradeTierMessage feature="AI Mentor" />;
    }

    return (
        <ChatPageClient
            currentUserId={user.id}
            currentUserTier={profile?.membership_tier || "bronze"}
            currentUserRole={profile?.role || "student"}
            termsAcceptedAi={profile?.terms_ai_accepted || false}
            termsAcceptedCommunity={profile?.terms_community_accepted || false}
        />
    );
}
