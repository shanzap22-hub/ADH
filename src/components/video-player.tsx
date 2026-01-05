"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";

interface VideoPlayerProps {
    chapterId: string;
    title: string;
    courseId: string;
    nextChapterId?: string;
    isLocked: boolean;
    completeOnEnd: boolean;
    videoUrl: string | null;
}

export const VideoPlayer = ({
    chapterId,
    title,
    courseId,
    nextChapterId,
    isLocked,
    completeOnEnd,
    videoUrl,
}: VideoPlayerProps) => {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    const onEnd = async () => {
        try {
            if (completeOnEnd) {
                await fetch(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isCompleted: true })
                });

                toast.success("Chapter marked as complete!");

                if (nextChapterId) {
                    router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
                } else {
                    // Last chapter - refresh to show completion
                    router.refresh();
                }
            }
        } catch (error) {
            toast.error("Failed to mark chapter as complete");
        }
    };

    // Locked content fallback
    if (isLocked) {
        return (
            <div className="relative aspect-video flex items-center justify-center bg-slate-800 flex-col gap-y-2 text-secondary">
                <Lock className="h-8 w-8" />
                <p className="text-sm">
                    This chapter is locked
                </p>
            </div>
        );
    }

    // Missing video fallback
    if (!videoUrl) {
        return (
            <div className="relative aspect-video flex items-center justify-center bg-slate-200 flex-col gap-y-2 text-slate-500">
                <p className="text-sm">
                    No video provided for this chapter.
                </p>
            </div>
        );
    }

    // Detect video type
    const isBunnyVideo = videoUrl.startsWith('bunny://');
    const bunnyVideoId = isBunnyVideo ? videoUrl.replace('bunny://', '') : null;
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isVimeo = videoUrl.includes('vimeo.com');
    const isExternalEmbed = isYouTube || isVimeo;

    // Bunny.net video
    if (isBunnyVideo && bunnyVideoId) {
        return (
            <div className="relative">
                <BunnyVideoPlayer
                    videoId={bunnyVideoId}
                    title={title}
                />
                {completeOnEnd && (
                    <div className="absolute bottom-4 right-4 z-10">
                        <button
                            onClick={onEnd}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition shadow-lg"
                        >
                            Mark as Completed
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Convert YouTube watch URL to embed URL
    const getEmbedUrl = (url: string) => {
        if (isYouTube) {
            return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
        }
        if (isVimeo) {
            const vimeoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${vimeoId}`;
        }
        return url;
    };

    return (
        <div className="relative aspect-video bg-slate-900">
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
            )}

            {isExternalEmbed ? (
                // YouTube/Vimeo iframe embed
                <iframe
                    src={getEmbedUrl(videoUrl)}
                    className={cn(
                        "absolute top-0 left-0 w-full h-full",
                        !isReady && "hidden"
                    )}
                    onLoad={() => setIsReady(true)}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            ) : (
                // HTML5 video for Supabase-hosted MP4
                <video
                    className="absolute top-0 left-0 w-full h-full"
                    controls
                    controlsList="nodownload"
                    onLoadedData={() => setIsReady(true)}
                    onEnded={onEnd}
                >
                    <source src={videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}

            {/* Manual completion button for iframe videos (since we can't detect onEnded) */}
            {completeOnEnd && isExternalEmbed && (
                <div className="absolute bottom-4 right-4 z-10">
                    <button
                        onClick={onEnd}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition shadow-lg"
                    >
                        Mark as Completed
                    </button>
                </div>
            )}
        </div>
    );
};
