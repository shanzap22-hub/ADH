import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="mb-6 space-y-2">
                <Skeleton className="h-10 w-[300px]" />
                <Skeleton className="h-4 w-[450px]" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-white border border-slate-200 p-6 flex flex-col justify-between">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-8 w-[60px]" />
                    </div>
                ))}
            </div>

            {/* Filters Skeleton */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[180px]" />
                <Skeleton className="h-10 w-[80px]" />
            </div>

            {/* Users List Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-32 rounded-xl bg-white border border-slate-200 p-6 flex items-center justify-between">
                        <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-6 w-[150px]" />
                                <Skeleton className="h-5 w-[80px]" />
                                <Skeleton className="h-5 w-[80px]" />
                            </div>
                            <div className="flex gap-4">
                                <Skeleton className="h-4 w-[200px]" />
                                <Skeleton className="h-4 w-[120px]" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-[120px]" />
                            <Skeleton className="h-10 w-[120px]" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
