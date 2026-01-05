"use client";

import { useState } from "react";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteCourseDialogProps {
    courseId: string;
    courseTitle: string;
}

export const DeleteCourseDialog = ({
    courseId,
    courseTitle,
}: DeleteCourseDialogProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const onDelete = async () => {
        try {
            setIsDeleting(true);

            const response = await fetch(`/api/courses/${courseId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete course");
            }

            toast.success("Course deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete course");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete <strong>{courseTitle}</strong> and all its chapters.
                        All uploaded files will be removed from storage. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete Course"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
