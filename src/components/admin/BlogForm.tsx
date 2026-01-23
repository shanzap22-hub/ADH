"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface BlogFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function BlogForm({ initialData, isEditing = false }: BlogFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        excerpt: initialData?.excerpt || "",
        content: initialData?.content || "",
        cover_image: initialData?.cover_image || "",
        is_published: initialData?.is_published || false,
        seo_title: initialData?.seo_title || "",
        seo_description: initialData?.seo_description || "",
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEditing
                ? `/api/admin/blog/${initialData.id}`
                : '/api/admin/blog';

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(isEditing ? "Post updated updated" : "Post created successfully");
                router.push('/admin/blog');
                router.refresh();
            } else {
                toast.error(data.error || "Something went wrong");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/blog">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">{isEditing ? "Edit Post" : "Create New Post"}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Enter post title"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Excerpt (Short Summary)</Label>
                            <Textarea
                                value={formData.excerpt}
                                onChange={(e) => handleChange('excerpt', e.target.value)}
                                placeholder="Short description for list view (1-2 sentences)"
                                className="h-20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content (HTML/Markdown)</Label>
                            <Textarea
                                value={formData.content}
                                onChange={(e) => handleChange('content', e.target.value)}
                                placeholder="Write your blog post here..."
                                className="h-[500px] font-mono text-sm leading-relaxed"
                            />
                            <p className="text-xs text-muted-foreground">Tip: You can use standard HTML tags or Markdown.</p>
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border space-y-4">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Publishing</h3>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="published"
                                    checked={formData.is_published}
                                    onCheckedChange={(checked) => handleChange('is_published', checked)}
                                />
                                <Label htmlFor="published" className="cursor-pointer">Publish Post</Label>
                            </div>

                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" disabled={loading}>
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {isEditing ? "Update Post" : "Create Post"}
                            </Button>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border space-y-4">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground">Media</h3>
                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                <FileUpload
                                    endpoint="blog-images" // Uploads to BunnyCDN folder 'blog-images'
                                    onChange={(url) => handleChange('cover_image', url)}
                                    value={formData.cover_image}
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border space-y-4">
                            <h3 className="font-semibold text-sm uppercase text-muted-foreground">SEO Settings</h3>

                            <div className="space-y-2">
                                <Label>Slug (URL)</Label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => handleChange('slug', e.target.value)}
                                    placeholder="auto-generated-from-title"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty to auto-generate from title.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>SEO Title</Label>
                                <Input
                                    value={formData.seo_title}
                                    onChange={(e) => handleChange('seo_title', e.target.value)}
                                    placeholder="Page Title for Google"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>SEO Description</Label>
                                <Textarea
                                    value={formData.seo_description}
                                    onChange={(e) => handleChange('seo_description', e.target.value)}
                                    placeholder="Meta Description for Google"
                                    className="h-24"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
