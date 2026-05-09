import { Skeleton } from "@/components/ui/skeleton";

// Premium dashboard loading — mobile-first
export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            {/* Header */}
            <div className="px-4 pt-6 pb-4 space-y-1.5">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Feed cards */}
            <div className="px-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-slate-200/60 dark:border-slate-700/30 bg-white dark:bg-slate-900 overflow-hidden p-4 space-y-3"
                    >
                        {/* Author row */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-3.5 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-6 w-6 rounded-md" />
                        </div>
                        {/* Text lines */}
                        <Skeleton className="h-3.5 w-full" />
                        <Skeleton className="h-3.5 w-5/6" />
                        {/* Media placeholder */}
                        {i < 2 && (
                            <Skeleton className="h-44 w-full rounded-xl" />
                        )}
                        {/* Reaction row */}
                        <div className="flex gap-4 pt-1">
                            <Skeleton className="h-7 w-16 rounded-full" />
                            <Skeleton className="h-7 w-16 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
