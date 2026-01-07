"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LessonNavigationProps {
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
}

export const LessonNavigation = ({
    onPrevious,
    onNext,
    hasPrevious,
    hasNext
}: LessonNavigationProps) => {
    return (
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!hasPrevious}
                className="flex items-center gap-2"
            >
                <ChevronLeft className="h-4 w-4" />
                Previous Lesson
            </Button>

            <Button
                onClick={onNext}
                disabled={!hasNext}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
            >
                Next Lesson
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};
