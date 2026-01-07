"use client";

import { BookOpen, Clock, Award } from "lucide-react";

interface CourseHeroProps {
    title: string;
    description: string | null;
    imageUrl: string | null;
    chaptersCount: number;
    lessonsCount: number;
}

export const CourseHero = ({
    title,
    description,
    imageUrl,
    chaptersCount,
    lessonsCount
}: CourseHeroProps) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />

            <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12">
                {/* Left: Course Info */}
                <div className="space-y-6 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit">
                        <Award className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-orange-400">Course</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            {title}
                        </h1>

                        {description && (
                            <p className="text-lg text-slate-300 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <BookOpen className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Chapters</p>
                                <p className="text-lg font-semibold text-white">{chaptersCount}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Clock className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Lessons</p>
                                <p className="text-lg font-semibold text-white">{lessonsCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Course Image */}
                <div className="relative aspect-video md:aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-24 w-24 text-slate-600" />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
            </div>
        </div>
    );
};
