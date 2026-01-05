import Image from "next/image";
import Link from "next/link";
import { Play, Lock, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitCardProps {
    courseId: string;
    chapterId: string;
    unit: {
        id: string;
        title: string;
        description?: string | null;
        duration_minutes?: number | null;
        is_free_preview: boolean;
        position: number;
    };
    isCompleted?: boolean;
    isLocked?: boolean;
}

export const UnitCard = ({
    courseId,
    chapterId,
    unit,
    isCompleted = false,
    isLocked = false,
}: UnitCardProps) => {
    return (
        <Link
            href={isLocked ? "#" : `/courses/${courseId}/chapters/${chapterId}/units/${unit.id}`}
            className={cn(
                "group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
                "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
                !isLocked && "hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700",
                isLocked && "opacity-60 cursor-not-allowed"
            )}
        >
            {/* Position number / Icon */}
            <div className="flex-shrink-0">
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-semibold transition-colors",
                    isCompleted
                        ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        : isLocked
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/30"
                )}>
                    {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : isLocked ? (
                        <Lock className="h-5 w-5" />
                    ) : (
                        <Play className="h-5 w-5" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {/* Title */}
                <h4 className={cn(
                    "font-semibold text-base mb-1 transition-colors",
                    !isLocked && "group-hover:text-orange-600 dark:group-hover:text-orange-400"
                )}>
                    {unit.position}. {unit.title}
                </h4>

                {/* Description */}
                {unit.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                        {unit.description}
                    </p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    {unit.duration_minutes && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{unit.duration_minutes} min</span>
                        </div>
                    )}

                    {unit.is_free_preview && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                            Free Preview
                        </span>
                    )}

                    {isCompleted && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full font-medium">
                            Completed
                        </span>
                    )}

                    {isLocked && (
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-medium">
                            Locked
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};
