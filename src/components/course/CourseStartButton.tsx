"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";

interface CourseStartButtonProps {
    courseId: string;
    hasProgress: boolean;
    firstChapterId?: string;
    lastViewedChapterId?: string;
    isEnrolled: boolean;
}

export const CourseStartButton = ({
    courseId,
    hasProgress,
    firstChapterId,
    lastViewedChapterId,
    isEnrolled
}: CourseStartButtonProps) => {
    const router = useRouter();

    const handleClick = () => {
        if (!isEnrolled) {
            // Redirect to enrollment/payment
            return;
        }

        // Determine which lesson to navigate to
        const targetChapterId = hasProgress && lastViewedChapterId
            ? lastViewedChapterId
            : firstChapterId;

        if (targetChapterId) {
            router.push(`/courses/${courseId}/learn?lesson=${targetChapterId}`);
        }
    };

    if (!isEnrolled) {
        return null; // Or show enrollment button
    }

    return (
        <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 md:space-y-1">
                    <h3 className="text-sm md:text-xl font-bold text-white leading-tight">
                        {hasProgress ? "Continue Learning" : "Start Your Journey"}
                    </h3>
                    <p className="text-[10px] md:text-sm text-orange-100 line-clamp-1">
                        {hasProgress
                            ? "Pick up where you left off"
                            : "Begin your first lesson now"}
                    </p>
                </div>

                <Button
                    onClick={handleClick}
                    className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg h-9 px-3 text-xs sm:h-11 sm:px-6 sm:text-base flex-shrink-0"
                >
                    {hasProgress ? (
                        <>
                            Continue
                            <ArrowRight className="ml-1.5 h-4 w-4 md:h-5 md:w-5" />
                        </>
                    ) : (
                        <>
                            Start Course
                            <Play className="ml-1.5 h-4 w-4 md:h-5 md:w-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
