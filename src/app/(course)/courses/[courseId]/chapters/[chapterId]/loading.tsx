import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChapterLoading() {
    return (
        <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden pt-14 animate-pulse">
            <div className="flex-1 w-full overflow-y-auto">
                <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-4">
                    
                    {/* Back Button Skeleton */}
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-4" />

                    {/* Title Area Skeleton */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-8 w-64 md:w-96 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                    </div>

                    {/* Video Player Skeleton */}
                    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg aspect-video relative flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse" />
                    </div>

                    {/* Navigation Buttons Skeleton */}
                    <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" disabled className="gap-2 opacity-50">
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button disabled className="gap-2 bg-slate-200 dark:bg-slate-800 text-transparent opacity-50">
                            Next Lesson
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tabs Area Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                        <div className="lg:col-span-2 space-y-4">
                            {/* Tabs Header */}
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-full">
                                <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-700 rounded-md" />
                                <div className="h-9 flex-1 bg-slate-200 dark:bg-slate-700 rounded-md" />
                            </div>
                            
                            {/* Tab Content */}
                            <div className="space-y-3 mt-6">
                                <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
                                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-[90%] bg-slate-200 dark:bg-slate-800 rounded" />
                                <div className="h-4 w-[85%] bg-slate-200 dark:bg-slate-800 rounded" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
