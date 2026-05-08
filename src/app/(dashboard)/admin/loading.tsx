import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="space-y-2">
                <Skeleton className="h-10 w-[400px]" />
                <Skeleton className="h-4 w-[300px]" />
            </div>

            {/* Statistics Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-[60px]" />
                    </div>
                ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 rounded-xl bg-white border border-slate-200 p-6 space-y-4">
                        <Skeleton className="h-6 w-[150px]" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <Skeleton className="h-4 w-[100px] mt-4" />
                    </div>
                ))}
            </div>
        </div>
    );
}
