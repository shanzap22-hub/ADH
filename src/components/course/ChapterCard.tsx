import Image from "next/image";
import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ChapterCardProps {
    courseId: string;
    chapter: {
        id: string;
        title: string;
        thumbnail_url?: string | null;
        description?: string | null;
        position: number;
    };
    unitsCount: number;
    progress?: number; // 0-100
    isLocked?: boolean;
}

export const ChapterCard = ({
    courseId,
    chapter,
    unitsCount,
    progress = 0,
    isLocked = false,
}: ChapterCardProps) => {
    return (
        <Link
            href={`/courses/${courseId}/chapters/${chapter.id}`}
            className={cn(
                "group relative overflow-hidden rounded-xl border transition-all duration-300",
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                "hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700",
                isLocked && "opacity-60 cursor-not-allowed"
            )}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                {chapter.thumbnail_url ? (
                    <Image
                        src={chapter.thumbnail_url}
                        alt={chapter.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center w-full h-full">
                        <BookOpen className="h-12 w-12 text-slate-400" />
                    </div>
                )}

                {/* Lock overlay */}
                {isLocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Lock className="h-8 w-8 text-white" />
                            <span className="text-white text-sm font-medium">Locked</span>
                        </div>
                    </div>
                )}

                {/* Position badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
                    <span className="text-white text-xs font-semibold">Chapter {chapter.position}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {chapter.title}
                </h3>

                {/* Description */}
                {chapter.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {chapter.description}
                    </p>
                )}

                {/* Units count */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                        {unitsCount} {unitsCount === 1 ? "lesson" : "lessons"}
                    </span>
                    {progress > 0 && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {Math.round(progress)}% complete
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                {progress > 0 && (
                    <Progress value={progress} className="h-1.5" />
                )}
            </div>
        </Link>
    );
};
