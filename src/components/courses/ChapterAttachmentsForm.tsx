"use client";

import * as z from "zod";
import axios from "axios";
import { PlusCircle, File, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";

interface Attachment {
    id: string;
    name: string;
    url: string; // Changed from file_url to url to match database
}

interface ChapterAttachmentsFormProps {
    initialData: any;
    courseId: string;
    chapterId: string;
    attachments: Attachment[];
}

const formSchema = z.object({
    url: z.string().min(1),
});

export const ChapterAttachmentsForm = ({
    initialData,
    courseId,
    chapterId,
    attachments
}: ChapterAttachmentsFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const toggleEdit = () => setIsEditing((current) => !current);

    const router = useRouter();

    const onSubmit = async (url: string) => {
        try {
            // Determine name from URL or default
            const name = url.split('/').pop() || "Attachment";

            await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/attachments`, {
                url: url,
                name: name
            });
            toast.success("Attachment added");
            toggleEdit();
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        }
    }

    const onDelete = async (id: string) => {
        try {
            setDeletingId(id);
            await axios.delete(`/api/courses/${courseId}/chapters/${chapterId}/attachments/${id}`);
            toast.success("Attachment deleted");
            router.refresh();
        } catch {
            toast.error("Something went wrong");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="mt-6 border bg-slate-100 dark:bg-slate-800 rounded-md p-4">
            <div className="font-medium flex items-center justify-between mb-2 text-slate-900 dark:text-slate-100">
                Chapter attachments
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing && (
                        <>Cancel</>
                    )}
                    {!isEditing && (
                        <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add a file
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <>
                    {attachments.length === 0 && (
                        <p className="text-sm mt-2 text-slate-500 italic">
                            No attachments yet
                        </p>
                    )}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center p-3 w-full bg-slate-200 dark:bg-slate-700 border-slate-200 border text-slate-700 dark:text-slate-300 rounded-md"
                                >
                                    <File className="h-4 w-4 mr-2 flex-shrink-0" />
                                    <p className="text-xs line-clamp-1">
                                        {attachment.name}
                                    </p>
                                    {deletingId === attachment.id && (
                                        <div className="ml-auto">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    )}
                                    {deletingId !== attachment.id && (
                                        <button
                                            onClick={() => onDelete(attachment.id)}
                                            className="ml-auto hover:opacity-75 transition"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
            {isEditing && (
                <div>
                    <FileUpload
                        endpoint="course-attachments"
                        onChange={(url) => {
                            if (url) {
                                onSubmit(url);
                            }
                        }}
                    />
                    <div className="text-xs text-muted-foreground mt-4">
                        Add anything your students might need to complete the chapter.
                    </div>
                </div>
            )}
        </div>
    );
}
