"use client";

import * as z from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { File as FileIcon, Loader2, PlusCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChapterAttachmentsFormProps {
    initialData: {
        id: string;
    };
    courseId: string;
    chapterId: string;
    attachments: { id: string; name: string; file_url: string }[];
}

export const ChapterAttachmentsForm = ({
    initialData,
    courseId,
    chapterId,
    attachments,
}: ChapterAttachmentsFormProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const file = formData.get("file") as File;

        if (!file) {
            toast.error("Please select a file");
            return;
        }

        try {
            setIsUploading(true);

            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${chapterId}-${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("course-attachments")
                .upload(fileName, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from("course-attachments")
                .getPublicUrl(fileName);

            // Save to database
            const { error: dbError } = await supabase
                .from("chapter_attachments")
                .insert({
                    chapter_id: chapterId,
                    name: file.name,
                    file_url: publicUrl,
                    file_size: file.size,
                    file_type: file.type,
                });

            if (dbError) {
                throw dbError;
            }

            toast.success("File uploaded successfully");
            router.refresh();
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            toast.error(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    const onDelete = async (attachmentId: string, fileUrl: string) => {
        try {
            setDeletingId(attachmentId);

            // Delete from storage
            const fileName = fileUrl.split('/').pop();
            if (fileName) {
                await supabase.storage
                    .from("course-attachments")
                    .remove([fileName]);
            }

            // Delete from database
            const { error } = await supabase
                .from("chapter_attachments")
                .delete()
                .eq("id", attachmentId);

            if (error) throw error;

            toast.success("Attachment deleted");
            router.refresh();
        } catch (error: any) {
            toast.error("Failed to delete attachment");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between mb-4">
                Chapter Attachments
            </div>

            {/* Upload Form */}
            <form onSubmit={onSubmit} className="space-y-4 mb-4">
                <Input
                    type="file"
                    name="file"
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                />
                <Button type="submit" disabled={isUploading} size="sm">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Upload File
                        </>
                    )}
                </Button>
            </form>

            {/* Attachments List */}
            {attachments.length > 0 ? (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center p-3 w-full bg-sky-100 border-sky-200 border text-sky-700 rounded-md"
                        >
                            <FileIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                            <p className="text-xs line-clamp-1 flex-1">
                                {attachment.name}
                            </p>
                            <Button
                                onClick={() => onDelete(attachment.id, attachment.file_url)}
                                disabled={deletingId === attachment.id}
                                size="sm"
                                variant="ghost"
                                className="ml-auto hover:bg-sky-200"
                            >
                                {deletingId === attachment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-slate-500 italic">
                    No attachments yet
                </p>
            )}
        </div>
    );
};
