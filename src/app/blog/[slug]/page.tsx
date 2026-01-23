import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { Calendar, ArrowLeft, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
    const params = await props.params;
    const supabase = await createClient();
    const { data: post } = await supabase
        .from('blog_posts')
        .select('seo_title, seo_description, title, excerpt, cover_image')
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single();


    if (!post) {
        return { title: 'Post Not Found | ADH Connect' };
    }

    return {
        title: post.seo_title || post.title,
        description: post.seo_description || post.excerpt,
        openGraph: {
            title: post.seo_title || post.title,
            description: post.seo_description || post.excerpt,
            images: post.cover_image ? [{ url: post.cover_image }] : [],
            type: 'article',
        },
    };
}

export default async function BlogPostPage(props: BlogPostPageProps) {
    const params = await props.params;
    const supabase = await createClient();

    // Fetch Post and Author details if needed
    const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*') // Assuming profile relation exists/linked manually
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single();

    if (error || !post) {
        notFound();
    }

    // JSON-LD for Article
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.seo_title || post.title,
        description: post.seo_description || post.excerpt,
        image: post.cover_image ? [post.cover_image] : [],
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: {
            '@type': 'Person',
            name: 'ADH Connect', // Or post.author?.full_name
        },
    };

    return (
        <article className="min-h-screen pb-20">
            {/* Header/Cover */}
            <div className="bg-slate-900 pt-32 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <Link href="/blog" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
                    </Link>

                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight break-words">
                        {post.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm">
                        <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {new Date(post.published_at || post.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                        <div className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            ADH Editorial
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto max-w-4xl px-4 -mt-10">
                {post.cover_image && (
                    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-2xl mb-12">
                        <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                )}

                <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-2xl shadow-sm border space-y-6">
                    {/* Render Content */}
                    <div
                        className="prose prose-lg prose-slate dark:prose-invert max-w-none leading-loose space-y-6 whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: post.content || '' }}
                    />
                </div>

                {/* Share Section (Optional Placeholder) */}
                <div className="mt-12 flex justify-center">
                    {/* Share buttons can be implemented here */}
                </div>
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </article>
    );
}
