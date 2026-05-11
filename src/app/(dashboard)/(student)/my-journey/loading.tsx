import { Skeleton } from "@/components/ui/skeleton";

export default function MyJourneyLoading() {
    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto pb-24 w-full animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-3xl bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <Skeleton className="h-[68px] w-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                    <Skeleton className="hidden lg:block h-[68px] w-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                </div>
            </div>

            {/* Achievement Timeline Skeleton */}
            <div className="w-full h-32 rounded-3xl bg-slate-200 dark:bg-slate-800" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rituals - Left Side (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-40 bg-slate-200 dark:bg-slate-800" />
                        <div className="grid gap-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
                            ))}
                        </div>
                    </div>
                    
                    {/* Motivational Card Skeleton */}
                    <Skeleton className="h-40 w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
                </div>

                {/* Revenue Ladder - Right Side (1/3) */}
                <div className="lg:col-span-1">
                    <Skeleton className="h-[500px] w-full rounded-3xl bg-slate-200 dark:bg-slate-800" />
                </div>
            </div>
        </div>
    );
}
