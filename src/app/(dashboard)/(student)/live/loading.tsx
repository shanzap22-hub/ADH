import { Skeleton } from "@/components/ui/skeleton";

export default function LiveLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">
            <div className="px-4 pt-6 pb-4 space-y-1.5">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-64" />
            </div>

            <div className="px-4 space-y-3">
                {/* Featured live card */}
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/30 bg-white dark:bg-slate-900 overflow-hidden">
                    <Skeleton className="h-44 w-full rounded-none" />
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3.5 w-36" />
                        <div className="flex items-center gap-2 pt-1">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </div>

                {/* Session list */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/30 bg-white dark:bg-slate-900 p-4 flex gap-3 items-center">
                        <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded-lg flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
