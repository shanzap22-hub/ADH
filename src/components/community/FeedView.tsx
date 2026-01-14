"use client";

import { PostCard } from "./PostCard";

interface FeedViewProps {
    posts: any[];
    isAdmin: boolean;
    currentUserId?: string;
}

export function FeedView({ posts, isAdmin, currentUserId }: FeedViewProps) {
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
            {posts.map((post, i) => (
                <div key={post.id} style={{ animationDelay: `${i * 50}ms` }} className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards">
                    <PostCard post={post} isAdmin={isAdmin} currentUserId={currentUserId} />
                </div>
            ))}
        </div>
    );
}
