"use client";

import { BookOpen, File, CheckCircle, Loader2, Link2 } from "lucide-react";
import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";
import { Button } from "@/components/ui/button";
import { useState, useTransition, useRef, useCallback } from "react";
import { updateChapterProgress } from "@/actions/update-progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface LessonViewerProps {
    courseId?: string;
    chapterId?: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    lessonNumber: number;
    isCompleted?: boolean;
    lastPlayedSecond?: number;
    attachments?: { id: string; name: string; url: string }[];
    onComplete?: () => void;
}

export const LessonViewer = ({
    courseId,
    chapterId,
    title,
    description,
    videoUrl,
    lessonNumber,
    isCompleted,
    lastPlayedSecond = 0,
    attachments = [],
    onComplete
}: LessonViewerProps) => {
    // 1. Clean the URL (remove spaces/newlines)
    const cleanUrl = videoUrl ? videoUrl.trim() : null;
    const [isLoading, startTransition] = useTransition();
    const router = useRouter();
    const lastSaveTimeRef = useRef<number>(0);

    const handleProgress = useCallback((seconds: number) => {
        // Save progress every 5 seconds
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 5000) {
            lastSaveTimeRef.current = now;
            if (courseId && chapterId) {
                // Ensure integer and log
                const sec = Math.floor(seconds);
                console.log("Saving progress:", sec);
                updateChapterProgress(courseId, chapterId, { lastPlayedSecond: sec })
                    .catch(e => console.error("Progress save failed", e));
            }
        }
    }, [courseId, chapterId]);

    const handleMarkAsComplete = () => {
        if (!courseId || !chapterId) return;

        startTransition(async () => {
            try {
                await updateChapterProgress(courseId, chapterId, { isCompleted: !isCompleted });
                if (!isCompleted) {
                    toast.success("Lesson marked as complete");
                }
                if (onComplete) onComplete();
                router.refresh(); // Refresh to update sidebar tick
            } catch (error) {
                toast.error("Something went wrong");
            }
        });
    };

    // Debug logging
    console.log('🎥 [LessonViewer] Processing URL:', {
        raw: videoUrl,
        clean: cleanUrl,
        length: videoUrl?.length,
        firstChar: videoUrl?.charCodeAt(0)
    });

    // Detect video type using clean URL
    const isBunnyVideo = cleanUrl?.startsWith('bunny://');
    const bunnyVideoId = isBunnyVideo ? cleanUrl?.replace('bunny://', '') : null;
    const isYouTube = cleanUrl?.includes('youtube.com') || cleanUrl?.includes('youtu.be');
    const isVimeo = cleanUrl?.includes('vimeo.com');
    const isExternalEmbed = isYouTube || isVimeo;

    console.log('🔍 [LessonViewer] Video Type Status:', {
        isBunnyVideo,
        bunnyVideoId,
        willRenderBunnyPlayer: !!(isBunnyVideo && bunnyVideoId)
    });

    // Convert YouTube/Vimeo URLs to embed format
    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('youtube.com/watch')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com')) {
            const vimeoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${vimeoId}`;
        }
        return url;
    };

    return (
        <div className="flex-1 bg-white dark:bg-slate-900">
            {/* Lesson Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                        Lesson {lessonNumber}
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {title}
                    </h1>
                </div>
                {courseId && chapterId && (
                    <Button
                        onClick={handleMarkAsComplete}
                        disabled={isLoading}
                        variant={isCompleted ? "outline" : "default"}
                        className={isCompleted ? "text-green-600 hover:text-green-700 border-green-200 bg-green-50" : "bg-orange-600 hover:bg-orange-700"}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isCompleted ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Completed
                            </>
                        ) : (
                            "Mark as Complete"
                        )}
                    </Button>
                )}
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-slate-900">
                {cleanUrl ? (
                    <>
                        {isBunnyVideo && bunnyVideoId ? (
                            // Bunny.net Video
                            <div className="w-full h-full">
                                <BunnyVideoPlayer
                                    videoId={bunnyVideoId}
                                    title={title}
                                    initialTime={lastPlayedSecond}
                                    onProgress={handleProgress}
                                    onEnd={async () => {
                                        if (courseId && chapterId && !isCompleted) {
                                            try {
                                                await updateChapterProgress(courseId, chapterId, { isCompleted: true });
                                                toast.success("Lesson completed!");
                                                if (onComplete) onComplete();
                                                router.refresh(); // Refresh ONLY after DB update is confirmed
                                            } catch (error) {
                                                console.error("Failed to update progress:", error);
                                                toast.error("Could not mark as complete");
                                            }
                                        }
                                    }}
                                />
                            </div>
                        ) : isExternalEmbed ? (
                            // YouTube/Vimeo
                            <iframe
                                src={getEmbedUrl(cleanUrl)}
                                className="w-full h-full"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen
                            />
                        ) : (
                            // Direct URL (fallback)
                            <iframe
                                src={cleanUrl}
                                className="w-full h-full"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen
                            />
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No video available for this lesson</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Lesson Description & Attachments */}
            <div className="p-6 space-y-6">
                {description && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                            About this lesson
                        </h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                )}

                {attachments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                            Attachments
                        </h2>
                        <div className="space-y-2">
                            {attachments.map((attachment) => {
                                const isFile = attachment.url.includes('uploadthing.com') || attachment.url.includes('supabase.co');

                                return (
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        key={attachment.id}
                                        rel="noreferrer"
                                        className="flex items-center p-3 w-full bg-slate-100 dark:bg-slate-800 border text-slate-700 dark:text-slate-300 rounded-md hover:underline"
                                    >
                                        {isFile ? (
                                            <File className="h-4 w-4 mr-2 flex-shrink-0 text-orange-500" />
                                        ) : (
                                            <Link2 className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                                        )}
                                        <div className="flex flex-col flex-1 overflow-hidden mr-2">
                                            <p className="font-medium line-clamp-1">{attachment.name}</p>
                                            {!isFile && (
                                                <span className="text-[10px] text-slate-500 no-underline line-clamp-1 truncate">
                                                    {attachment.url}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
