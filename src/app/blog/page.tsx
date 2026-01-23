import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Blog | ADH Connect - Insights on SMM & Business Growth",
    description: "Read the latest articles on Social Media Marketing, AI Automation, and Digital Leadership for entrepreneurs in Kerala.",
};

export default async function BlogListPage() {
    const supabase = await createClient();

    const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

    if (error) {
        console.error("Error fetching posts:", error);
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
                    ADH Insights
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Expert strategies and guides to help you master digital marketing and scale your business.
                </p>
            </div>

            {!posts || posts.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">No updates yet. Check back soon!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Card key={post.id} className="flex flex-col h-full hover:shadow-lg transition-shadow overflow-hidden border-slate-200 dark:border-slate-800">
                            {post.cover_image && (
                                <div className="relative h-48 w-full">
                                    <Image
                                        src={post.cover_image}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <CardHeader className="space-y-2 p-6">
                                <div className="text-xs text-muted-foreground flex items-center mb-2">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {new Date(post.published_at || post.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                </div>
                                <Link href={`/blog/${post.slug}`} className="hover:underline">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                                        {post.title}
                                    </h2>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 flex-1">
                                <p className="text-muted-foreground text-sm line-clamp-3">
                                    {post.excerpt}
                                </p>
                            </CardContent>
                            <CardFooter className="p-6 pt-0">
                                <Link href={`/blog/${post.slug}`} className="w-full">
                                    <Button variant="outline" className="w-full group">
                                        Read Article
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
