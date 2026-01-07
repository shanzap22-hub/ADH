"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Play } from "lucide-react";
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
}

export const CourseCard = ({
    id,
    title,
    imageUrl,
    chaptersLength,
    progress,
    category
}: CourseCardProps) => {
    return (
        <Link href={`/courses/${id}`}>
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-orange-500/10 h-full">
                {/* Image with gradient overlay */}
                <div className="relative w-full aspect-video rounded-t-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                    {imageUrl ? (
                        <Image
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={title}
                            src={imageUrl}
                            onError={(e) => {
                                // Hide broken image, show fallback
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : null}

                    {/* Fallback icon for missing/broken images */}
                    {!imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-20 w-20 text-slate-600" />
                        </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />

                    {/* Play button overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <Play className="h-8 w-8 text-white ml-1" fill="white" />
                        </div>
                    </div>

                    {/* Category badge */}
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-950/80 backdrop-blur-sm text-orange-400 border border-orange-500/30">
                            {category}
                        </span>
                    </div>
                </div>

                {/* Content with glassmorphism */}
                <div className="p-5 space-y-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-tight">
                        {title}
                    </h3>

                    <div className="flex items-center gap-x-2 text-sm text-slate-400">
                        <div className="flex items-center gap-x-1.5">
                            <BookOpen className="h-4 w-4 text-orange-400" />
                            <span className="font-medium">
                                {chaptersLength} {chaptersLength === 1 ? "Chapter" : "Chapters"}
                            </span>
                        </div>
                    </div>

                    {/* Progress Section */}
                    {progress !== null ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Progress</span>
                                <span className="font-semibold text-orange-400">{Math.round(progress)}%</span>
                            </div>
                            <CourseProgress
                                variant={progress === 100 ? "success" : "default"}
                                size="sm"
                                value={progress}
                            />
                        </div>
                    ) : (
                        <div className="pt-2">
                            <span className="inline-block px-4 py-2 text-sm font-bold rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30">
                                Enrolled
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
};
