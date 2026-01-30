import { createClient } from "@/lib/supabase/server";
import { FeedView } from "@/components/community/FeedView";
import { CreatePost } from "@/components/community/CreatePost";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Feed | ADH Connect",
    description: "Stay updated with the latest news",
};

import { LiveSessionsBanner } from "@/components/community/LiveSessionsBanner";

// ... (imports)

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

    const userTier = profile?.membership_tier || 'free';
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

    // Fetch Live Sessions (buffer -24h to allow client timezone filtering)
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    const { data: weeklySessions } = await (supabase as any)
        .from('weekly_live_sessions')
        .select('*')
        .gte('scheduled_at', yesterday)
        .order('scheduled_at', { ascending: true })
        .limit(5);

    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, profiles:instructor_id(full_name)')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('start_time', yesterday)
        .order('start_time', { ascending: true })
        .limit(5);

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
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Community Feed</h1>
                    <p className="text-slate-500">Join the discussion and stay updated</p>
                </div>

                {/* Live Sessions Banner */}
                <LiveSessionsBanner
                    weeklySessions={weeklySessions || []}
                    bookings={bookings || []}
                />

                {isAdmin && <CreatePost />}
                <FeedView posts={posts || []} isAdmin={isAdmin} currentUserId={user.id} />
            </div>
        </div>
    );
}
