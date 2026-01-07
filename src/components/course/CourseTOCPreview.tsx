"use client";

import { CheckCircle2, Circle, Lock } from "lucide-react";

interface Chapter {
    id: string;
    title: string;
    description: string | null;
    position: number;
    isCompleted?: boolean;
    isLocked?: boolean;
}

interface CourseTOCPreviewProps {
    chapters: Chapter[];
}

export const CourseTOCPreview = ({ chapters }: CourseTOCPreviewProps) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Course Content
            </h3>

            <div className="space-y-3">
                {chapters.map((chapter, index) => (
                    <div
                        key={chapter.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 transition-colors"
                    >
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                            {chapter.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : chapter.isLocked ? (
                                <Lock className="h-5 w-5 text-slate-400" />
                            ) : (
                                <Circle className="h-5 w-5 text-slate-400" />
                            )}
                        </div>

                        {/* Chapter Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Chapter {index + 1}
                                </span>
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                                {chapter.title}
                            </h4>
                            {chapter.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {chapter.description}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {chapters.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No chapters available yet
                </div>
            )}
        </div>
    );
};
