import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List all posts (for Admin - includes drafts)
export async function GET(req: Request) {
    try {
        const supabase = await createClient();

        // Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Role Check (Optional but recommended)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST: Create a new post
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, content, excerpt, cover_image, is_published, seo_title, seo_description } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Generate Slug
        let slug = title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens

        // Append random string to ensure uniqueness if needed, or handle conflict
        // Simple check:
        const { count } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('slug', slug);
        if (count && count > 0) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        const payload = {
            title,
            slug,
            content,
            excerpt,
            cover_image,
            is_published: is_published || false,
            published_at: is_published ? new Date().toISOString() : null,
            author_id: user.id,
            seo_title: seo_title || title,
            seo_description: seo_description || excerpt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('blog_posts')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
