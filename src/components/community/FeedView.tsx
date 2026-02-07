"use client";

import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";

interface FeedViewProps {
    posts: any[];
    isAdmin: boolean;
    currentUserId?: string;
    limit?: number; // Optional limit for Dashboard view
}

export function FeedView({ posts, isAdmin, currentUserId, limit }: FeedViewProps) {
    const displayedPosts = limit ? posts.slice(0, limit) : posts;
    const hasMore = limit ? posts.length > limit : false;

    if (posts.length === 0) {
        return (
            <div className="text-center py-20 animate-in fade-in duration-500">
                <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                    <span className="text-4xl">📭</span>
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No updates yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                    Check back later for community news and announcements.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {displayedPosts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                />
            ))}

            {hasMore && (
                <div className="text-center pt-4">
                    <Button variant="outline" className="w-full py-6 text-purple-600 border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all font-semibold" asChild>
                        <a href="/community">
                            View All Posts ({posts.length})
                        </a>
                    </Button>
                </div>
            )}
        </div>
    );
}
