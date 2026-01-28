"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Pin, ExternalLink, Globe, Lock, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { EditPostDialog } from "./EditPostDialog";

interface Post {
    id: string;
    created_at: string;
    content: string;
    link: string | null;
    image_url: string | null;
    is_pinned: boolean;
    author_id: string;
    author: {
        full_name: string | null;
        avatar_url: string | null;
    };
    post_tier_access: { tier: string }[];
}

interface PostCardProps {
    post: Post;
    isAdmin: boolean;
    currentUserId?: string;
}

const TIER_COLORS: Record<string, string> = {
    bronze: "bg-orange-100 text-orange-800 border-orange-200",
    silver: "bg-slate-100 text-slate-800 border-slate-200",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
    diamond: "bg-blue-100 text-blue-800 border-blue-200",
};

export function PostCard({ post, isAdmin, currentUserId }: PostCardProps) {
    const isPublic = post.post_tier_access.length === 0;
    const isAuthor = currentUserId === post.author_id;
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        try {
            const res = await fetch(`/api/feed/delete?id=${post.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete post");

            toast.success("Post deleted");
            router.refresh();
        } catch (error) {
            toast.error("Could not delete post");
        }
    };

    const getExternalLink = (url: string | null) => {
        if (!url) return "#";
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        return `https://${url}`;
    };

    const ImageContent = (
        <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-center">
            <img
                src={post.image_url!}
                alt="Post attachment"
                className="w-auto h-auto max-w-full max-h-[500px] object-contain"
            />
        </div>
    );

    return (
        <>
            <div className={`
                group relative p-6 rounded-2xl border transition-all duration-300
                ${post.is_pinned
                    ? "bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800"
                    : "bg-white border-slate-100 shadow-sm hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
                }
            `}>
                {post.is_pinned && (
                    <div className="absolute top-4 right-4 text-purple-600 dark:text-purple-400 rotate-12">
                        <Pin className="w-5 h-5 fill-current" />
                    </div>
                )}

                <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-700 shadow-sm">
                        <AvatarImage src={post.author.avatar_url || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {post.author.full_name?.[0]?.toUpperCase() || "A"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between pr-8">
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {post.author.full_name || "Admin"}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                </p>
                            </div>

                            {(isAuthor || isAdmin) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDelete}>
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                            <p className="whitespace-pre-wrap">{post.content}</p>
                        </div>

                        {post.image_url && (
                            post.link ? (
                                <Link href={getExternalLink(post.link)} target="_blank" rel="noopener noreferrer" className="block">
                                    {ImageContent}
                                </Link>
                            ) : ImageContent
                        )}

                        {post.link && !post.image_url && (
                            <Link
                                href={getExternalLink(post.link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline mt-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {post.link}
                            </Link>
                        )}

                        {isAdmin && (
                            <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Visible to:
                                </span>
                                {post.post_tier_access.length > 0 ? (
                                    post.post_tier_access.map((pta) => (
                                        <Badge
                                            key={pta.tier}
                                            variant="outline"
                                            className={`${TIER_COLORS[pta.tier] || "bg-gray-100"} text-[10px] px-2 py-0 h-5 border`}
                                        >
                                            {pta.tier.toUpperCase()}
                                        </Badge>
                                    ))
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] h-5">ALL</Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <EditPostDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                post={post}
            />
        </>
    );
}
