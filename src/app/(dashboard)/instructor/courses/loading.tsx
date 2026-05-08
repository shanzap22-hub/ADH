import { Skeleton } from "@/components/ui/skeleton";

export default function InstructorCoursesLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[200px] bg-slate-800" />
                    <Skeleton className="h-4 w-[300px] bg-slate-800" />
                </div>
                <Skeleton className="h-10 w-[140px] bg-slate-800" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col justify-between">
                        <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[100px] bg-slate-800" />
                            <Skeleton className="h-8 w-[60px] bg-slate-800" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Courses Grid Skeleton */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[350px] rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden space-y-4">
                        <Skeleton className="h-[180px] w-full bg-slate-800" />
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-3/4 bg-slate-800" />
                                <Skeleton className="h-4 w-1/2 bg-slate-800" />
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <Skeleton className="h-4 w-20 bg-slate-800" />
                                <Skeleton className="h-8 w-24 bg-slate-800" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
