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
    courseId: string;
}

import Link from "next/link";
import { PlayCircle } from "lucide-react";

export const CourseTOCPreview = ({ chapters, courseId }: CourseTOCPreviewProps) => {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                Course Content
            </h3>

            <div className="space-y-3">
                {chapters.map((chapter, index) => {
                    const isLocked = chapter.isLocked;

                    const ChapterInner = (
                        <div
                            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${isLocked
                                    ? "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 cursor-not-allowed text-slate-400"
                                    : "border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 cursor-pointer bg-white dark:bg-slate-900"
                                }`}
                        >
                            {/* Status Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                                {chapter.isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : isLocked ? (
                                    <Lock className="h-5 w-5 text-slate-400" />
                                ) : (
                                    <PlayCircle className="h-5 w-5 text-slate-800 dark:text-slate-200" />
                                )}
                            </div>

                            {/* Chapter Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Chapter {index + 1}
                                    </span>
                                    {/* Duration Placeholder - If DB has duration, use chapter.duration */}
                                    <span className="text-xs text-slate-400">
                                        10:00 {/* Placeholder as DB column unknown */}
                                    </span>
                                </div>
                                <h4 className={`font-semibold mb-1 ${isLocked ? "text-slate-500" : "text-slate-900 dark:text-white"}`}>
                                    {chapter.title}
                                </h4>
                            </div>
                        </div>
                    );

                    return isLocked ? (
                        <div key={chapter.id}>{ChapterInner}</div>
                    ) : (
                        <Link href={`/courses/${courseId}/chapters/${chapter.id}`} key={chapter.id}>
                            {ChapterInner}
                        </Link>
                    );
                })}
            </div>

            {chapters.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No chapters available yet
                </div>
            )}
        </div>
    );
};
