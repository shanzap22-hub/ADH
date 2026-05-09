import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32 flex flex-col">
            {/* Header */}
            <div className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/60">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-xl" />
            </div>

            {/* Chat messages skeleton */}
            <div className="flex-1 px-4 py-4 space-y-4">
                {/* Incoming */}
                <div className="flex gap-2 items-end">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1">
                        <Skeleton className="h-10 w-48 rounded-2xl rounded-bl-sm" />
                    </div>
                </div>
                {/* Outgoing */}
                <div className="flex gap-2 items-end justify-end">
                    <Skeleton className="h-8 w-36 rounded-2xl rounded-br-sm" />
                </div>
                {/* Incoming long */}
                <div className="flex gap-2 items-end">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-1.5">
                        <Skeleton className="h-10 w-52 rounded-2xl rounded-bl-sm" />
                        <Skeleton className="h-10 w-40 rounded-2xl rounded-bl-sm" />
                    </div>
                </div>
                {/* Outgoing */}
                <div className="flex gap-2 items-end justify-end">
                    <Skeleton className="h-8 w-44 rounded-2xl rounded-br-sm" />
                </div>
                {/* Image message */}
                <div className="flex gap-2 items-end">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <Skeleton className="h-40 w-52 rounded-2xl rounded-bl-sm" />
                </div>
            </div>

            {/* Input area */}
            <div className="px-4 pb-28 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex gap-2 items-center">
                    <Skeleton className="h-11 flex-1 rounded-2xl" />
                    <Skeleton className="h-11 w-11 rounded-2xl flex-shrink-0" />
                </div>
            </div>
        </div>
    );
}
