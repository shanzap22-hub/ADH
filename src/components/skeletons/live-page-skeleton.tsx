import { Skeleton } from "@/components/ui/skeleton";
import { Video, Clock, Users } from "lucide-react";

export function LiveSessionCardSkeleton() {
    return (
        <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl opacity-15 blur" />
            <div className="relative h-full border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden flex flex-col">
                {/* Banner Skeleton */}
                <div className="h-36 w-full overflow-hidden relative">
                    <Skeleton className="h-full w-full" />
                    <div className="absolute bottom-2 left-3">
                        <Skeleton className="h-5 w-32 rounded-md" />
                    </div>
                </div>

                {/* Header */}
                <div className="pb-0 pt-4 px-5">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                </div>

                {/* Content */}
                <div className="px-5 pt-3 pb-2 flex-grow space-y-3">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>

                {/* Footer */}
                <div className="px-5 pb-5 pt-0">
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function LivePageSkeleton() {
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-5 w-96 max-w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <LiveSessionCardSkeleton />
                <LiveSessionCardSkeleton />
                <LiveSessionCardSkeleton />
            </div>
        </div>
    );
}
