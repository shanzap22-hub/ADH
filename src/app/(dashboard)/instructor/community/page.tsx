import { createClient } from "@/lib/supabase/server";
import { FeedView } from "@/components/community/FeedView";
import { CreatePost } from "@/components/community/CreatePost";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Instructor Community | ADH LMS",
    description: "Post updates to the community",
};

export default async function InstructorCommunityPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    // Ensure only instructors/admins access this
    if (profile?.role !== "instructor" && profile?.role !== "super_admin") {
        return redirect("/dashboard");
    }

    const canPost = true; // Since they are in the instructor route, they can post

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
        <div className="p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Community Feed</h1>
                    <p className="text-slate-500">Post updates and announcements to your students.</p>
                </div>

                <CreatePost />
                <div className="mt-8">
                    <FeedView posts={posts || []} isAdmin={true} />
                </div>
            </div>
        </div>
    );
}
