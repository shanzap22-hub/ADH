"use client";

import * as z from "zod";
import axios from "axios";
import { PlusCircle, File, Loader2, X, Link2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { Input } from "@/components/ui/input";

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

const linkSchema = z.object({
    url: z.string().url({ message: "Please enter a valid URL" }),
    name: z.string().min(1, { message: "Name is required" }),
});

export const ChapterAttachmentsForm = ({
    initialData,
    courseId,
    chapterId,
    attachments
}: ChapterAttachmentsFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSubmittingLink, setIsSubmittingLink] = useState(false);

    // Link form state
    const [linkUrl, setLinkUrl] = useState("");
    const [linkName, setLinkName] = useState("");

    const toggleEdit = () => {
        setIsEditing((current) => !current);
        if (isEditingLink) setIsEditingLink(false);
    };

    const toggleEditLink = () => {
        setIsEditingLink((current) => !current);
        if (isEditing) setIsEditing(false);
        setLinkUrl("");
        setLinkName("");
    };

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
            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            console.error("Failed to attach:", error);
            const msg = error.response?.data || "Something went wrong";
            toast.error(typeof msg === 'string' ? msg : "Failed to save attachment");
        }
    }

    const onLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSubmittingLink(true);

            // Validate link
            const result = linkSchema.safeParse({ url: linkUrl, name: linkName });
            if (!result.success) {
                toast.error((result.error as any).errors[0].message);
                return;
            }

            await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/attachments`, {
                url: linkUrl,
                name: linkName
            });
            toast.success("Link added");
            toggleEditLink();
            router.refresh();
        } catch (error: any) {
            console.error("Failed to attach link:", error);
            const msg = error.response?.data || "Something went wrong";
            toast.error(typeof msg === 'string' ? msg : "Failed to save link attachment");
        } finally {
            setIsSubmittingLink(false);
        }
    };

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

    // Helper to determine if attachment is a visual file or a raw link
    const isFileUrl = (url: string) => {
        return url.includes('uploadthing.com') || url.includes('supabase.co');
    };

    return (
        <div className="mt-6 border bg-slate-100 dark:bg-slate-800 rounded-md p-4">
            <div className="font-medium flex items-center justify-between mb-2 text-slate-900 dark:text-slate-100">
                Chapter attachments
                <div className="flex gap-2">
                    {/* File Upload Button */}
                    <Button onClick={toggleEdit} variant="ghost" size="sm">
                        {isEditing && (
                            <>Cancel</>
                        )}
                        {!isEditing && !isEditingLink && (
                            <>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add a file
                            </>
                        )}
                    </Button>

                    {/* Link Upload Button */}
                    <Button onClick={toggleEditLink} variant="ghost" size="sm">
                        {isEditingLink && (
                            <>Cancel</>
                        )}
                        {!isEditingLink && !isEditing && (
                            <>
                                <Link2 className="h-4 w-4 mr-2" />
                                Add a link
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {!isEditing && !isEditingLink && (
                <>
                    {attachments.length === 0 && (
                        <p className="text-sm mt-2 text-slate-500 italic">
                            No attachments yet
                        </p>
                    )}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            {attachments.map((attachment) => {
                                const isFile = isFileUrl(attachment.url);
                                return (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center p-3 w-full bg-slate-200 dark:bg-slate-700 border-slate-200 border text-slate-700 dark:text-slate-300 rounded-md"
                                    >
                                        {isFile ? (
                                            <File className="h-4 w-4 mr-2 flex-shrink-0 text-orange-500" />
                                        ) : (
                                            <Link2 className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                                        )}
                                        <div className="flex flex-col flex-1 overflow-hidden mr-2">
                                            <p className="text-xs font-medium line-clamp-1">
                                                {attachment.name}
                                            </p>
                                            {!isFile && (
                                                <a href={attachment.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 hover:underline line-clamp-1 truncate">
                                                    {attachment.url}
                                                </a>
                                            )}
                                        </div>
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
                                );
                            })}
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

            {isEditingLink && (
                <form onSubmit={onLinkSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Input
                            disabled={isSubmittingLink}
                            placeholder="e.g. Meta Blueprint Guide"
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            required
                        />
                        <Input
                            disabled={isSubmittingLink}
                            placeholder="e.g. https://www.facebook.com/business/learn"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            type="url"
                            required
                        />
                    </div>
                    <div className="flex items-center gap-x-2">
                        <Button disabled={isSubmittingLink || !linkName || !linkUrl} type="submit">
                            Save Link
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Add external web links for your students to review.
                    </div>
                </form>
            )}
        </div>
    );
}
