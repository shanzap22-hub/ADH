import { ChevronRight, Layout } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function UnitLoading() {
    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex flex-col animate-pulse">
            {/* Cinema Video Area Skeleton */}
            <div className="w-full bg-black/95 relative border-b border-slate-800 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-12">
                    <div className="relative aspect-video w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-slate-900/50 border border-slate-800/50 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Content Area Skeleton */}
            <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    
                    {/* Left: Main Details */}
                    <div className="flex-1 space-y-8">
                        {/* Header Skeleton */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-700" />
                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                            <div className="h-10 w-3/4 max-w-md bg-slate-200 dark:bg-slate-800 rounded-lg" />
                        </div>

                        <Separator className="bg-slate-200 dark:bg-slate-800" />

                        {/* Description Skeleton */}
                        <div className="space-y-3">
                            <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-4 w-[90%] bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-4 w-[80%] bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>

                    {/* Right: Sidebar Skeleton */}
                    <div className="w-full lg:w-96 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Layout className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                                <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
