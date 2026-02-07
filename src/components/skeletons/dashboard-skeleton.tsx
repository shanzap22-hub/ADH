import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, BookOpen, TrendingUp, Clock } from "lucide-react";

export function DashboardSkeleton() {
    return (
        <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Feed Column (Left) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>

                    {/* Live Sessions Banner Skeleton */}
                    <div className="h-[200px] w-full bg-white/50 rounded-xl p-6">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <Skeleton className="h-32 w-full" />
                    </div>

                    {/* Feed Posts Skeleton */}
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex items-start gap-3 mb-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Column (Right) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Welcome / Stats Card Skeleton */}
                    <div className="overflow-hidden border-none shadow-lg rounded-2xl bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#581c87] text-white relative p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32 bg-white/20" />
                                <Skeleton className="h-4 w-24 bg-white/20" />
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-black/20 rounded-xl backdrop-blur-sm">
                            <div className="flex justify-between text-sm mb-2">
                                <Skeleton className="h-3 w-24 bg-white/20" />
                                <Skeleton className="h-3 w-8 bg-white/20" />
                            </div>
                            <Skeleton className="h-2 w-full bg-black/20" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm text-center border border-white/10">
                                <BookOpen className="w-5 h-5 mx-auto text-primary-foreground/80 mb-1" />
                                <Skeleton className="h-6 w-8 mx-auto bg-white/20 mb-1" />
                                <Skeleton className="h-2 w-16 mx-auto bg-white/20" />
                            </div>
                            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm text-center border border-white/10">
                                <TrendingUp className="w-5 h-5 mx-auto text-primary-foreground/80 mb-1" />
                                <Skeleton className="h-6 w-8 mx-auto bg-white/20 mb-1" />
                                <Skeleton className="h-2 w-20 mx-auto bg-white/20" />
                            </div>
                        </div>
                    </div>

                    {/* Continue Learning Skeleton */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-500" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-8 w-16" />
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                                    <Skeleton className="h-32 w-full rounded-lg mb-3" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
