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

interface DeleteChapterDialogProps {
    courseId: string;
    chapterId: string;
    chapterTitle: string;
}

export const DeleteChapterDialog = ({
    courseId,
    chapterId,
    chapterTitle,
}: DeleteChapterDialogProps) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const onDelete = async () => {
        try {
            setIsDeleting(true);

            const response = await fetch(`/api/courses/${courseId}/chapters/${chapterId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Failed to delete chapter");
            }

            toast.success("Chapter deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete chapter");
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
                    variant="ghost"
                    className="hover:bg-destructive hover:text-destructive-foreground transition"
                >
                    <Trash className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the chapter <strong>"{chapterTitle}"</strong> and its video.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete Chapter"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
