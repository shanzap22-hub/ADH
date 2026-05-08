import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCoursesLoading() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-4 w-[350px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 rounded-xl bg-white border border-slate-200 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-5 w-[80px]" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
