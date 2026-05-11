"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback, memo } from "react";

import { BookOpen, Play, Lock, ArrowRight } from "lucide-react";
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
    backgroundClass?: string;
    titleClass?: string;
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
}: CourseCardProps) => {
    const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        e.currentTarget.style.display = "none";
    }, []);

    const isEnrolled = progress !== null;
    const isCompleted = progress === 100;

    return (
        <>
            <Link href={`/courses/${id}`} className="block h-full group">
                <div className={`
                    relative h-full flex flex-col overflow-hidden rounded-2xl
                    border border-slate-200/80 dark:border-slate-700/50
                    bg-white dark:bg-slate-900
                    shadow-sm hover:shadow-xl hover:shadow-violet-500/10 dark:hover:shadow-violet-900/20
                    transition-all duration-300 ease-out
                    hover:-translate-y-1
                    ${backgroundClass || ""}
                `}>

                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        {imageUrl ? (
                            <Image
                                fill
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                alt={title}
                                src={imageUrl}
                                onError={handleImageError}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <BookOpen className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Play button hover */}
                        {!isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                    <Play className="h-5 w-5 text-violet-600 fill-violet-600 ml-0.5" />
                                </div>
                            </div>
                        )}

                        {/* Locked overlay */}
                        {isLocked && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm gap-2">
                                <Lock className="h-7 w-7 text-white" />
                                {requiredTier && (
                                    <span className="text-xs text-white/80 font-medium px-3 py-1 rounded-full bg-white/10 border border-white/20">
                                        {requiredTier}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Category badge */}
                        {category && (
                            <div className="absolute top-2.5 left-2.5">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white/90">
                                    {category}
                                </span>
                            </div>
                        )}

                        {/* Completed badge */}
                        {isCompleted && (
                            <div className="absolute top-2.5 right-2.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                                    ✓ Done
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4 gap-3">
                        <h3 className={`
                            line-clamp-2 text-sm font-semibold leading-snug min-h-[40px]
                            text-slate-800 dark:text-slate-100
                            group-hover:text-violet-700 dark:group-hover:text-violet-400
                            transition-colors duration-200
                            ${titleClass || ""}
                        `}>
                            {title}
                        </h3>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800">
                                <BookOpen className="h-3 w-3" />
                                <span>{chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}</span>
                            </div>
                        </div>

                        {/* Progress / CTA */}
                        <div className="mt-auto">
                            {isEnrolled ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                                        <span className={isCompleted
                                            ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                                            : "text-violet-600 dark:text-violet-400 font-semibold"
                                        }>
                                            {Math.round(progress!)}%
                                        </span>
                                    </div>
                                    <CourseProgress
                                        variant={isCompleted ? "success" : "default"}
                                        size="sm"
                                        value={progress!}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {isLocked ? "Upgrade Required" : "Start Learning"}
                                    </span>
                                    {!isLocked && (
                                        <div className="w-7 h-7 rounded-full bg-violet-50 dark:bg-violet-950/50 group-hover:bg-violet-600 flex items-center justify-center transition-all duration-200 border border-violet-200 dark:border-violet-800 group-hover:border-violet-600">
                                            <ArrowRight className="h-3 w-3 text-violet-500 group-hover:text-white transition-colors duration-200" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom accent line on hover */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
            </Link>
        </>
    );
};

export const CourseCard = memo(CourseCardComponent);
