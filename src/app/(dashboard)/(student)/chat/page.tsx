import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MetaballLoader } from "@/components/ui/metaball-loader";
import nextDynamic from "next/dynamic";

const ChatPageClient = nextDynamic(() => import("@/components/chat/ChatPageClient"), {
    loading: () => <div className="h-[80vh] w-full flex items-center justify-center"><MetaballLoader /></div>
});

export const metadata = {
    title: "Chat | ADH Connect",
    description: "Connect with your peers",
};

// 2026 Performance: Always fresh for real-time chat
export const revalidate = 0;
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

    // Check tier capabilities for BOTH AI and Community Chat
    const { data: tierSettings } = await supabase
        .from("tier_pricing")
        .select("has_ai_access, has_community_chat_access")
        .eq("tier", profile?.membership_tier || "free")
        .single();

    const isAdmin =
        profile?.role === "super_admin" ||
        profile?.role === "instructor" ||
        profile?.role === "admin";

    const hasAiAccess = isAdmin || tierSettings?.has_ai_access === true;
    const hasCommunityAccess = isAdmin || tierSettings?.has_community_chat_access === true;

    // Allow page access if user has ANY chat access
    // Individual features will be locked in the UI
    const hasAnyChatAccess = hasAiAccess || hasCommunityAccess;

    if (!hasAnyChatAccess) {
        const { UpgradeTierMessage } = await import("@/components/UpgradeTierMessage");
        return <UpgradeTierMessage feature="Chat" />;
    }

    let initialGroupChat = null;
    if (hasCommunityAccess) {
        try {
            const { getGlobalGroupChat } = await import("@/actions/chat-actions");
            initialGroupChat = await getGlobalGroupChat();
        } catch (e) {
            console.error("Failed to prefetch group chat", e);
        }
    }

    return (
        <ChatPageClient
            currentUserId={user.id}
            currentUserTier={profile?.membership_tier || "bronze"}
            currentUserRole={profile?.role || "student"}
            termsAcceptedAi={profile?.terms_ai_accepted || false}
            termsAcceptedCommunity={profile?.terms_community_accepted || false}
            hasAiAccess={hasAiAccess}
            hasCommunityAccess={hasCommunityAccess}
            initialGroupChat={initialGroupChat}
        />
    );
}
