"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Play, Lock } from "lucide-react";
import { IconBadge } from "@/components/icon-badge";
import { CourseProgress } from "@/components/course-progress";

interface CourseCardProps {
    id: string;
    title: string;
    imageUrl: string;
    chaptersLength: number;
    price: number;
    progress: number | null;
    category: string;
    isLocked?: boolean;
    requiredTier?: string;
}

export const CourseCard = ({
    id,
    title,
    imageUrl,
    chaptersLength,
    progress,
    category,
    isLocked = false,
    requiredTier
}: CourseCardProps) => {
    return (
        <Link href={`/courses/${id}`}>
            <div className="group h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
                {/* Image Section - Compact Aspect Ratio 4:3 */}
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            alt={title}
                            src={imageUrl}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <BookOpen className="h-10 w-10 text-slate-500" />
                        </div>
                    )}

                    {/* Locked Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <Lock className="h-8 w-8 text-white" />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex flex-col p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-purple-700 dark:text-slate-100 dark:group-hover:text-purple-400 min-h-[40px]">
                        {title}
                    </h3>

                    {/* Meta Data */}
                    <div className="mt-2 flex items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-x-1">
                            <BookOpen className="h-3 w-3" />
                            <span>
                                {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
                            </span>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-3">
                        {progress !== null ? (
                            <div className="space-y-1">
                                <CourseProgress
                                    variant={progress === 100 ? "success" : "default"}
                                    size="sm"
                                    value={progress}
                                />
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-right">
                                    {Math.round(progress)}% Complete
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {isLocked ? `Locked (${requiredTier})` : "Start Course"}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};
