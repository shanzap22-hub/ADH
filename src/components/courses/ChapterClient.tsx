"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, LayoutDashboard, Eye, Video, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChapterTitleForm } from "@/components/courses/ChapterTitleForm";
import { ChapterDescriptionForm } from "@/components/courses/ChapterDescriptionForm";
import { ChapterAccessForm } from "@/components/courses/ChapterAccessForm";
import { ChapterVideoForm } from "@/components/courses/ChapterVideoForm";
import { ChapterAttachmentsForm } from "@/components/courses/ChapterAttachmentsForm";

interface ChapterData {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    is_free: boolean;
}

interface ChapterClientProps {
    initialChapter: ChapterData;
    attachments: any[];
    courseId: string;
    chapterId: string;
}

export function ChapterClient({ initialChapter, attachments, courseId, chapterId }: ChapterClientProps) {
    const router = useRouter();
    const supabase = createClient();

    // Track chapter state
    const [chapterData, setChapterData] = useState<ChapterData>(initialChapter);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Track unsaved changes
    useEffect(() => {
        const hasChanges =
            chapterData.title !== initialChapter.title ||
            chapterData.description !== initialChapter.description ||
            chapterData.video_url !== initialChapter.video_url ||
            chapterData.is_free !== initialChapter.is_free;

        setHasUnsavedChanges(hasChanges);
    }, [chapterData, initialChapter]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Save all chapter data
    const saveChapter = async () => {
        try {
            setIsSaving(true);
            console.log("[CHAPTER_SAVE] Saving chapter:", chapterData);

            const { error, data } = await supabase
                .from("chapters")
                .update({
                    title: chapterData.title,
                    description: chapterData.description,
                    video_url: chapterData.video_url,
                    is_free: chapterData.is_free,
                })
                .eq("id", chapterId)
                .select()
                .single();

            if (error) {
                console.error("[CHAPTER_SAVE] Error:", error);

                // User-friendly error messages
                if (error.code === '42703') {
                    toast.error("Database configuration error", {
                        description: "Missing column in database. Please contact support."
                    });
                } else if (error.code === '23505') {
                    toast.error("Duplicate entry", {
                        description: "This content already exists."
                    });
                } else {
                    toast.error("Failed to save chapter", { description: error.message });
                }
                return;
            }

            console.log("[CHAPTER_SAVE] Saved successfully:", data);

            // CRITICAL FIX: Update the chapter state with saved data
            // This clears the dirty state and makes future comparisons accurate
            setChapterData(data);

            toast.success("Chapter saved successfully!");
            setHasUnsavedChanges(false);
            router.refresh();
        } catch (error: any) {
            console.error("[CHAPTER_SAVE] Exception:", error);
            toast.error("Something went wrong", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    // Update handlers
    const updateTitle = (title: string) => {
        setChapterData(prev => ({ ...prev, title }));
    };

    const updateDescription = (description: string | null) => {
        setChapterData(prev => ({ ...prev, description }));
    };

    const updateVideoUrl = (video_url: string | null) => {
        setChapterData(prev => ({ ...prev, video_url }));
    };

    const updateAccess = (is_free: boolean) => {
        setChapterData(prev => ({ ...prev, is_free }));
    };

    return (
        <div className="p-6">
            {/* Header with Save Button */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/instructor/courses/${courseId}`}
                        className="flex items-center text-sm hover:opacity-75 transition"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to course setup
                    </Link>
                </div>

                <Button
                    onClick={saveChapter}
                    disabled={!hasUnsavedChanges || isSaving}
                    className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            {hasUnsavedChanges ? "Save Chapter" : "No Changes"}
                        </>
                    )}
                </Button>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ You have unsaved changes. Click "Save Chapter" to keep your changes.
                    </p>
                </div>
            )}

            {/* Rest of the page content */}
            <div className="flex flex-col gap-y-2 mb-6">
                <h1 className="text-2xl font-medium">Chapter Creation/Edit</h1>
                <span className="text-sm text-muted-foreground">
                    Complete all fields and click Save Chapter.
                </span>
            </div>

            {/* Chapter forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-x-2 mb-4">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <LayoutDashboard className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Customize your chapter
                            </h2>
                        </div>
                        {/* Title Form - Pass change handler */}
                        <ChapterTitleForm
                            initialData={chapterData}
                            courseId={courseId}
                            chapterId={chapterId}
                            onChange={updateTitle}
                        />
                        {/* Description Form - Pass change handler */}
                        <ChapterDescriptionForm
                            initialData={chapterData}
                            courseId={courseId}
                            chapterId={chapterId}
                            onChange={updateDescription}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-x-2 mb-4">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <Eye className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Access Settings
                            </h2>
                        </div>
                        {/* Access Form - Pass change handler */}
                        <ChapterAccessForm
                            initialData={chapterData}
                            courseId={courseId}
                            chapterId={chapterId}
                            onChange={updateAccess}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-x-2 mb-4">
                        <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                            <Video className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                        </div>
                        <h2 className="text-xl font-medium">
                            Add a video
                        </h2>
                    </div>
                    {/* Video Form - Pass change handler */}
                    <ChapterVideoForm
                        initialData={chapterData}
                        courseId={courseId}
                        chapterId={chapterId}
                        onChange={updateVideoUrl}
                    />

                    {/* Attachments Section */}
                    <div className="mt-6">
                        <div className="flex items-center gap-x-2 mb-4">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <FileText className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Resources & Attachments
                            </h2>
                        </div>
                        {/* Attachments still auto-save (separate from chapter data) */}
                        <ChapterAttachmentsForm
                            initialData={chapterData}
                            courseId={courseId}
                            chapterId={chapterId}
                            attachments={attachments}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
