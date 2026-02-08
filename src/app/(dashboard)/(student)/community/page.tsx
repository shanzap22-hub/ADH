import { createClient } from "@/lib/supabase/server";
import nextDynamic from "next/dynamic";
import { MetaballLoader } from "@/components/ui/metaball-loader";

const FeedView = nextDynamic(() => import("@/components/community/FeedView").then(mod => mod.FeedView), {
    loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-white/50 rounded-xl"><MetaballLoader /></div>
});

const CreatePost = nextDynamic(() => import("@/components/community/CreatePost").then(mod => mod.CreatePost), {
    loading: () => <div className="h-[150px] w-full flex items-center justify-center bg-white/50 rounded-xl"><MetaballLoader /></div>
});
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Feed | ADH Connect",
    description: "Stay updated with the latest news",
};

// 2026 Performance: 1-minute cache for social feed
export const revalidate = 60;

// ... (imports)

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    // CRITICAL: Check tier-based community feed access
    const { data: profile } = await supabase
        .from("profiles")
        .select("membership_tier, role")
        .eq("id", user.id)
        .single();

    const userTier = (profile?.membership_tier || 'free').toLowerCase();
    const isAdmin = profile?.role === "super_admin" || profile?.role === "admin";

    // Check if user's tier has community feed access
    const { data: tierData } = await supabase
        .from("tier_pricing")
        .select("has_community_feed_access")
        .eq("tier", userTier)
        .single();

    const hasCommunityFeedAccess = isAdmin || tierData?.has_community_feed_access || false;

    // If no access, show upgrade message
    if (!hasCommunityFeedAccess) {
        const { UpgradeTierMessage } = await import("@/components/UpgradeTierMessage");
        return <UpgradeTierMessage feature="Community Feed" />;
    }



    // Fetch Posts
    const { data: posts } = await supabase
        .from("posts")
        .select(`
            *,
            post_tier_access ( tier ),
            author:profiles ( full_name, avatar_url )
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 bg-clip-text text-transparent tracking-tight">Community Feed</h1>
                    <p className="text-slate-500">Join the discussion and stay updated</p>
                </div>



                {isAdmin && <CreatePost />}
                <FeedView posts={posts || []} isAdmin={isAdmin} currentUserId={user.id} />
            </div>
        </div>
    );
}
