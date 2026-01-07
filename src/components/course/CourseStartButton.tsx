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
        <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">
                        {hasProgress ? "Continue Learning" : "Start Your Journey"}
                    </h3>
                    <p className="text-orange-100">
                        {hasProgress
                            ? "Pick up where you left off"
                            : "Begin your first lesson now"}
                    </p>
                </div>

                <Button
                    onClick={handleClick}
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shadow-lg"
                >
                    {hasProgress ? (
                        <>
                            Continue
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    ) : (
                        <>
                            Start Course
                            <Play className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
