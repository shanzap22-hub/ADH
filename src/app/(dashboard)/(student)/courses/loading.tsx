import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            {/* Page Header Skeleton */}
            <div className="px-4 md:px-8 pt-5 md:pt-8 pb-4 space-y-1.5 animate-pulse">
                <Skeleton className="h-8 md:h-10 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>

            <div className="px-4 md:px-8 space-y-4">
                {/* Filter chips skeleton */}
                <div className="flex items-center gap-2 overflow-hidden -mx-4 px-4 md:mx-0 md:px-0 -mt-2">
                    {[60, 90, 80, 70].map((w, i) => (
                        <Skeleton key={i} className="h-7 md:h-8 rounded-full flex-shrink-0" style={{ width: w }} />
                    ))}
                </div>

                {/* Courses Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-700/30 bg-white dark:bg-slate-900 animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
                            {/* Thumbnail */}
                            <Skeleton className="aspect-video w-full rounded-none" />
                            {/* Content */}
                            <div className="p-4 flex flex-col gap-3 min-h-[120px]">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="mt-auto flex items-center justify-between pt-2">
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-7 w-7 rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
