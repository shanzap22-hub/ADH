import { Skeleton } from "@/components/ui/skeleton";

export default function CourseIdLoading() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-[env(safe-area-inset-top)]">
            <div className="max-w-6xl mx-auto p-4 space-y-8 animate-pulse">
                {/* Back Button Skeleton */}
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />

                {/* Program Hero Skeleton */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row h-auto md:h-72">
                    <div className="w-full md:w-2/5 h-48 md:h-full bg-slate-200 dark:bg-slate-800" />
                    <div className="p-6 md:p-8 flex-1 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <div className="pt-4 flex gap-4">
                            <Skeleton className="h-10 w-24 rounded-lg" />
                            <Skeleton className="h-10 w-24 rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Grid for Progress and Start Button Skeleton */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-32 space-y-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-2 w-full rounded-full" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-32 flex items-center justify-center">
                        <Skeleton className="h-12 w-3/4 rounded-lg" />
                    </div>
                </div>

                {/* TOC Preview Skeleton */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 mt-8">
                    <Skeleton className="h-6 w-48 mb-6" />
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
