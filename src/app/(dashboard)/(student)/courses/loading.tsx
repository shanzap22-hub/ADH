import { Skeleton } from "@/components/ui/skeleton";

// Mobile-first premium course grid skeleton
export default function CoursesLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header skeleton */}
            <div className="px-4 pt-6 pb-4 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Filter chips skeleton */}
            <div className="px-4 pb-4 flex gap-2 overflow-hidden">
                {[80, 100, 90, 70, 110].map((w, i) => (
                    <Skeleton key={i} className="h-8 rounded-full flex-shrink-0" style={{ width: w }} />
                ))}
            </div>

            {/* Course grid skeleton */}
            <div className="px-4 grid grid-cols-2 gap-3 pb-32">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/30 bg-white dark:bg-slate-900" style={{ animationDelay: `${i * 100}ms` }}>
                        {/* Thumbnail */}
                        <Skeleton className="aspect-video w-full rounded-none" />
                        {/* Content */}
                        <div className="p-3 space-y-2">
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3 w-4/5" />
                            <div className="flex items-center justify-between pt-1">
                                <Skeleton className="h-3 w-16 rounded-full" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
