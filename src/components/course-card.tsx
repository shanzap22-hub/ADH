"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback, memo } from "react";
import { MetaballLoader } from "@/components/ui/metaball-loader";
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

const CourseCardComponent = ({
    id,
    title,
    imageUrl,
    chaptersLength,
    progress,
    category,
    isLocked = false,
    requiredTier,
    backgroundClass,
    titleClass
}: CourseCardProps & { backgroundClass?: string; titleClass?: string }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Memoize handlers to prevent unnecessary re-renders
    const handleClick = useCallback(() => {
        setIsLoading(true);
    }, []);

    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = 'none';
    }, []);

    return (
        <>
            {isLoading && <MetaballLoader fullscreen />}
            <Link href={`/courses/${id}`} onClick={handleClick}>
                <div className={`group h-full flex flex-col overflow-hidden rounded-2xl border bg-opacity/50 backdrop-blur-md shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-black/5 ${backgroundClass || "bg-white/70 border-white/20 dark:bg-slate-900/60 dark:border-slate-700"
                    }`}>
                    {/* Image Section */}
                    <div className="relative aspect-video w-full overflow-hidden">
                        {imageUrl ? (
                            <Image
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                alt={title}
                                src={imageUrl}
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
                                <BookOpen className="h-10 w-10 text-slate-300" />
                            </div>
                        )}

                        {/* Locked Overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                        )}


                    </div>

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col p-4">
                        <h3 className={`line-clamp-2 text-base font-bold group-hover:text-orange-600 transition-colors dark:text-slate-100 min-h-[48px] ${titleClass || "text-slate-800"}`}>
                            {title}
                        </h3>

                        {/* Meta Data */}
                        <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-x-1 bg-slate-50 px-2 py-1 rounded-md">
                                <BookOpen className="h-3 w-3" />
                                <span>
                                    {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
                                </span>
                            </div>
                        </div>

                        {/* Progress / Footer */}
                        <div className="mt-auto pt-4">
                            {progress !== null ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-500">Progress</span>
                                        <span className={progress === 100 ? "text-green-600" : "text-slate-700"}>
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                    <CourseProgress
                                        variant={progress === 100 ? "success" : "default"}
                                        size="sm"
                                        value={progress}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500">
                                        {isLocked ? "Access Required" : "Start Learning"}
                                    </span>
                                    {!isLocked && (
                                        <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-orange-500 flex items-center justify-center transition-colors">
                                            <Play className="h-3 w-3 text-slate-400 group-hover:text-white fill-current ml-0.5" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </>
    );
};

// Wrap component with React.memo to prevent unnecessary re-renders
export const CourseCard = memo(CourseCardComponent);

