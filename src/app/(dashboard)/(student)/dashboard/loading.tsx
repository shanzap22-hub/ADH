import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[#f7f6ff] dark:bg-slate-950 pb-28 md:pb-8">
            {/* ─────────────────────────── MOBILE LAYOUT SKELETON ─────────────────────── */}
            <div className="md:hidden px-4 pt-4 space-y-4">
                {/* 1. Compact Stats Card Skeleton */}
                <div className="rounded-2xl p-4 bg-slate-200 dark:bg-slate-800 animate-pulse h-28" />

                {/* 2. Live Sessions Banner Skeleton */}
                <div className="h-28 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />

                {/* 3. Community Feed Skeleton */}
                <div>
                    <div className="mb-3">
                        <Skeleton className="h-6 w-36" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/30 p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                                    <div className="space-y-1.5 flex-1">
                                        <Skeleton className="h-3.5 w-28" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <Skeleton className="h-3.5 w-full" />
                                <Skeleton className="h-48 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Continue Learning Skeleton */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="space-y-3">
                        {[1, 2].map(i => (
                            <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden flex gap-3 p-3">
                                <Skeleton className="h-16 w-24 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2 py-1">
                                    <Skeleton className="h-3.5 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─────────────────────────── DESKTOP LAYOUT SKELETON ─────────────────────── */}
            <div className="hidden md:block p-8">
                <div className="grid grid-cols-12 gap-8">
                    {/* Left — Feed */}
                    <div className="col-span-8 space-y-6">
                        <div className="space-y-1.5">
                            <Skeleton className="h-9 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="rounded-2xl border border-slate-200/60 dark:border-slate-700/30 bg-white dark:bg-slate-900 p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-64 w-full rounded-xl" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — Stats + Learning */}
                    <div className="col-span-4 space-y-6">
                        {/* Welcome Card Skeleton */}
                        <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        
                        {/* Continue Learning Skeleton */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 overflow-hidden flex gap-3 p-3">
                                        <Skeleton className="h-16 w-24 rounded-xl flex-shrink-0" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <Skeleton className="h-3.5 w-full" />
                                            <Skeleton className="h-3 w-2/3" />
                                            <Skeleton className="h-1.5 w-full rounded-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
