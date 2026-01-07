"use client";

import { CheckCircle2, Circle } from "lucide-react";

interface CourseProgressProps {
    completedLessons: number;
    totalLessons: number;
}

export const CourseProgress = ({
    completedLessons,
    totalLessons
}: CourseProgressProps) => {
    const progressPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Your Progress
                    </h3>
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {progressPercentage}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-pink-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{completedLessons} completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Circle className="h-4 w-4" />
                        <span>{totalLessons - completedLessons} remaining</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
