import { formatDistanceToNow } from "date-fns";
import { Pin, ExternalLink, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
    id: string;
    created_at: string;
    content: string;
    link: string | null;
    is_pinned: boolean;
    author: {
        full_name: string | null;
        avatar_url: string | null;
    };
    post_tier_access: { tier: string }[];
}

interface PostCardProps {
    post: Post;
    isAdmin: boolean;
}

const TIER_COLORS: Record<string, string> = {
    bronze: "bg-orange-100 text-orange-800 border-orange-200",
    silver: "bg-slate-100 text-slate-800 border-slate-200",
    gold: "bg-yellow-100 text-yellow-800 border-yellow-200",
    diamond: "bg-blue-100 text-blue-800 border-blue-200",
};

export function PostCard({ post, isAdmin }: PostCardProps) {
    const isPublic = post.post_tier_access.length === 0; // Or if we define logic for public

    return (
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
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>

                    {post.link && (
                        <Link
                            href={post.link}
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
    );
}
