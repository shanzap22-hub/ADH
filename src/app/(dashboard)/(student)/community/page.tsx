import { createClient } from "@/lib/supabase/server";
import { FeedView } from "@/components/community/FeedView";
import { CreatePost } from "@/components/community/CreatePost";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Community Feed | ADH Connect",
    description: "Stay updated with the latest news",
};

export default async function CommunityPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    const isAdmin = profile?.role === "super_admin" || profile?.role === "instructor";

    // Fetch Posts
    // Note: RLS policies on 'posts' will automatically filter invisible posts for non-admins
    // The policy "Users can view posts matching their tier" does the heavy lifting.
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
        <div className="min-h-screen bg-slate-50/50 dark:bg-black/20 p-6 lg:p-10">
            <div className="max-w-3xl mx-auto">
                <div className="mb-10 space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Community Feed</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Stay updated with the latest news and announcements.</p>
                </div>

                {isAdmin && <CreatePost />}
                <FeedView posts={posts || []} isAdmin={isAdmin} currentUserId={user.id} />
            </div>
        </div>
    );
}
