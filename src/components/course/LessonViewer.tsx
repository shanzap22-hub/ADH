"use client";

import { BookOpen } from "lucide-react";
import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";

interface LessonViewerProps {
    title: string;
    description: string | null;
    videoUrl: string | null;
    lessonNumber: number;
}

export const LessonViewer = ({
    title,
    description,
    videoUrl,
    lessonNumber
}: LessonViewerProps) => {
    // 1. Clean the URL (remove spaces/newlines)
    const cleanUrl = videoUrl ? videoUrl.trim() : null;

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
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                    Lesson {lessonNumber}
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {title}
                </h1>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-slate-900">
                {cleanUrl ? (
                    <>
                        {isBunnyVideo && bunnyVideoId ? (
                            // Bunny.net Video
                            <div className="w-full h-full">
                                <BunnyVideoPlayer videoId={bunnyVideoId} title={title} />
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

            {/* Lesson Description */}
            {description && (
                <div className="p-6">
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
        </div>
    );
};
