"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CoursePublishButtonProps {
    courseId: string;
    isPublished: boolean;
}

export const CoursePublishButton = ({
    courseId,
    isPublished: initialIsPublished,
}: CoursePublishButtonProps) => {
    const [isPublished, setIsPublished] = useState(initialIsPublished);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onClick = async () => {
        try {
            setIsLoading(true);

            const newPublishState = !isPublished;

            const response = await fetch(`/api/courses/${courseId}/publish`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isPublished: newPublishState,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update publish status");
            }

            setIsPublished(newPublishState);
            toast.success(
                newPublishState ? "Course published" : "Course unpublished"
            );
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={onClick}
            disabled={isLoading}
            variant={isPublished ? "outline" : "default"}
            size="sm"
        >
            {isPublished ? (
                <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Unpublish
                </>
            ) : (
                <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish
                </>
            )}
        </Button>
    );
};
