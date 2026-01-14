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
        <div className="relative overflow-hidden bg-slate-900 rounded-xl border border-slate-700/50">
            <div className="relative flex flex-col md:flex-row gap-6 p-6">
                {/* Image Section - Compact & Left aligned on desktop */}
                <div className="w-full md:w-1/3 flex-shrink-0">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-12 w-12 text-slate-600" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col justify-center space-y-3 flex-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 w-fit">
                        <Award className="h-3 w-3 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">Course</span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {title}
                    </h1>

                    {description && (
                        <p className="text-sm md:text-base text-slate-300 line-clamp-2">
                            {description}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <BookOpen className="h-4 w-4 text-blue-400" />
                            <span className="text-sm">{chaptersCount} Chapters</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock className="h-4 w-4 text-purple-400" />
                            <span className="text-sm">{lessonsCount} Lessons</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
