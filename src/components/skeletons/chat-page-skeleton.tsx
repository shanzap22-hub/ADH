import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Sparkles } from "lucide-react";

export function ChatSkeleton() {
    return (
        <div className="h-[80vh] w-full flex flex-col bg-white dark:bg-slate-950 rounded-xl shadow-lg overflow-hidden">
            {/* Header Skeleton */}
            <div className="border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            </div>

            {/* Chat Messages Skeleton */}
            <div className="flex-1 p-6 space-y-4 overflow-hidden">
                {/* Incoming message */}
                <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-3/4 rounded-2xl" />
                    </div>
                </div>

                {/* Outgoing message */}
                <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1 space-y-2 flex flex-col items-end">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-2/3 rounded-2xl" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                </div>

                {/* Incoming message */}
                <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-4/5 rounded-2xl" />
                    </div>
                </div>

                {/* Outgoing message */}
                <div className="flex items-start gap-3 justify-end">
                    <div className="flex-1 space-y-2 flex flex-col items-end">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-14 w-1/2 rounded-2xl" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                </div>
            </div>

            {/* Input Skeleton */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="flex-1 h-12 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function ChatPageSkeleton() {
    return (
        <div className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <ChatSkeleton />
        </div>
    );
}
