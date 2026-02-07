import { Skeleton } from "@/components/ui/skeleton";

export function CourseCardSkeleton() {
    return (
        <div className="group h-full flex flex-col overflow-hidden rounded-2xl border bg-white/70 border-white/20 dark:bg-slate-900/60 dark:border-slate-700 shadow-lg">
            {/* Image Skeleton */}
            <div className="relative aspect-video w-full overflow-hidden">
                <Skeleton className="h-full w-full" />
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col p-4">
                {/* Title Skeleton */}
                <div className="space-y-2 min-h-[48px]">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Meta Data Skeleton */}
                <div className="mt-3 flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-md" />
                </div>

                {/* Progress Skeleton */}
                <div className="mt-auto pt-4 space-y-2">
                    <div className="flex justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function CoursesListSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="space-y-6">
            {/* Filter Bar Skeleton */}
            <div className="flex items-center gap-2 -mt-2">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-full" />
            </div>

            {/* Courses Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: count }).map((_, i) => (
                    <CourseCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
