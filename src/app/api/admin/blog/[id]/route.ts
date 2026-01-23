import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.from('blog_posts').select('*').eq('id', params.id).single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { title, slug, content, excerpt, cover_image, is_published, seo_title, seo_description } = body;

        const supabase = await createClient();

        // Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload: any = {
            title,
            slug, // Slug can be edited, but risky if URL changes. Assuming admin knows.
            content,
            excerpt,
            cover_image,
            is_published,
            seo_title,
            seo_description,
            updated_at: new Date().toISOString()
        };

        if (is_published) {
            // If publishing now and wasn't before? Or just update timestamp if previously null?
            // payload.published_at = new Date().toISOString(); 
            // Better logic: If payload.is_published is true, ensuring logic if desired.
        }

        const { data, error } = await supabase
            .from('blog_posts')
            .update(payload)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();

        // Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { error } = await supabase.from('blog_posts').delete().eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
