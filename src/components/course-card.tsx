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
            <div className="group h-full flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900">
                {/* Image Section */}
                <div className="relative aspect-video w-full overflow-hidden">
                    {imageUrl ? (
                        <Image
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={title}
                            src={imageUrl}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
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

                    {/* Category Pill Over Image */}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                        {category}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-base font-bold text-slate-800 group-hover:text-orange-600 transition-colors dark:text-slate-100 min-h-[48px]">
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
    );
};
