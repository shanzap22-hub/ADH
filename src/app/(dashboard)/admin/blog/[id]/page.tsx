import { BlogForm } from "@/components/admin/BlogForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface EditBlogPageProps {
    params: {
        id: string;
    };
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Unauthorized</div>;

    const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error || !post) {
        notFound();
    }

    return <BlogForm initialData={post} isEditing={true} />;
}
