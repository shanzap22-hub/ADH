"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseEnrollButtonProps {
    courseId: string;
    price?: number;
    isEnrolled?: boolean;
}

export const CourseEnrollButton = ({
    courseId,
    price,
    isEnrolled,
}: CourseEnrollButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onEnroll = async () => {
        try {
            setIsLoading(true);

            // Direct free enrollment - no payment required
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: "POST",
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || "Failed to enroll");
            }

            toast.success("Successfully enrolled! Redirecting to course...");

            // Redirect to course player
            setTimeout(() => {
                router.push(`/courses/${courseId}`);
                router.refresh();
            }, 1000);

        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={onEnroll}
            disabled={isLoading}
            size="lg"
            className="w-full md:w-auto"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enrolling...
                </>
            ) : (
                <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enroll for Free
                </>
            )}
        </Button>
    );
};
