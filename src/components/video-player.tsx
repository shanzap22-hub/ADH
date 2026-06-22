"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";
import { useFullscreenOrientation } from "@/hooks/useFullscreenOrientation";
import { getVideoType, extractYouTubeId } from "@/lib/video-utils";
import { YoutubeVideoPlayer } from "@/components/course/YoutubeVideoPlayer";
import { VimeoVideoPlayer } from "@/components/course/VimeoVideoPlayer";
import { NativeVideoPlayer } from "@/components/course/NativeVideoPlayer";

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
    const containerRef = useRef<HTMLDivElement>(null);
    useFullscreenOrientation(containerRef, videoUrl);

    const onEnd = async () => {
        try {
            if (completeOnEnd) {
                await fetch(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isCompleted: true })
                });

                toast.success("Module marked as complete!");

                if (nextChapterId) {
                    router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
                } else {
                    router.refresh();
                }
            }
        } catch (error) {
            toast.error("Failed to mark Module as complete");
        }
    };

    // Locked content fallback
    if (isLocked) {
        return (
            <div className="relative aspect-video flex items-center justify-center bg-slate-800 flex-col gap-y-2 text-secondary">
                <Lock className="h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-300">
                    This Module is locked
                </p>
            </div>
        );
    }

    // Missing video fallback
    if (!videoUrl) {
        return (
            <div className="relative aspect-video flex items-center justify-center bg-slate-200 flex-col gap-y-2 text-slate-500">
                <p className="text-sm">
                    No video provided for this module.
                </p>
            </div>
        );
    }

    // Detect video type
    const videoType = getVideoType(videoUrl);
    const isBunnyVideo = videoType === "bunny";
    const bunnyVideoId = isBunnyVideo ? videoUrl.replace('bunny://', '').split(/[?#]/)[0] : null;
    const youtubeId = videoType === "youtube" ? extractYouTubeId(videoUrl) : null;
    const vimeoId = videoType === "vimeo" ? videoUrl.match(/vimeo\.com\/(?:.*\/)?(\d+)/)?.[1] : null;

    return (
        <div ref={containerRef} className="relative aspect-video bg-slate-900">
            {isBunnyVideo && bunnyVideoId ? (
                <BunnyVideoPlayer
                    videoId={bunnyVideoId}
                    courseId={courseId}
                    title={title}
                    disableFullscreenHook={true}
                    onEnd={onEnd}
                />
            ) : videoType === "youtube" && youtubeId ? (
                <YoutubeVideoPlayer
                    videoId={youtubeId}
                    onEnd={onEnd}
                    title={title}
                />
            ) : videoType === "vimeo" && vimeoId ? (
                <VimeoVideoPlayer
                    videoId={vimeoId}
                    onEnd={onEnd}
                    title={title}
                />
            ) : (
                <NativeVideoPlayer
                    src={videoUrl}
                    onEnd={onEnd}
                />
            )}

            {completeOnEnd && (videoType === "youtube" || videoType === "vimeo") && (
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
