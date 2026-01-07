"use client";

import { BookOpen } from "lucide-react";

interface LessonViewerProps {
    title: string;
    description: string | null;
    videoUrl: string | null;
    lessonNumber: number;
}

export const LessonViewer = ({
    title,
    description,
    videoUrl,
    lessonNumber
}: LessonViewerProps) => {
    return (
        <div className="flex-1 bg-white dark:bg-slate-900">
            {/* Lesson Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                    Lesson {lessonNumber}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {title}
                </h1>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-slate-900">
                {videoUrl ? (
                    <iframe
                        src={videoUrl}
                        className="w-full h-full"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No video available for this lesson</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Lesson Description */}
            {description && (
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        About this lesson
                    </h2>
                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
