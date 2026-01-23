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
        .select("has_chat_access")
        .eq("tier", profile?.membership_tier || "bronze")
        .single();

    const isAdmin =
        profile?.role === "super_admin" ||
        profile?.role === "instructor" ||
        profile?.role === "admin";

    const hasAccess = isAdmin || tierSettings?.has_chat_access === true;

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                </div>
                <h2 className="text-xl font-bold">Chat Access Restricted</h2>
                <p className="text-slate-500 max-w-md">
                    Your current membership plan does not include access to Community Chat.
                    Please upgrade your plan to unlock this feature.
                </p>
            </div>
        );
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
