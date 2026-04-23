import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Feed Column (Left) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-10 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>

                    {/* Banner Skeleton */}
                    <Skeleton className="h-48 w-full rounded-2xl" />

                    {/* Feed Skeletons */}
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border-none shadow-sm overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-48 w-full rounded-xl" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Sidebar Column (Right) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Stats Card Skeleton */}
                    <Card className="h-64 border-none shadow-lg bg-slate-200 animate-pulse rounded-2xl">
                    </Card>

                    {/* Continue Learning Skeleton */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <Card key={i} className="border-none shadow-sm overflow-hidden">
                                    <div className="aspect-video w-full bg-slate-200 animate-pulse" />
                                    <CardContent className="p-4 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
