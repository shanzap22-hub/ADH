"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BunnyVideoPlayerProps {
    videoId: string;
    title?: string;
    onEnd?: () => void;
    className?: string;
    initialTime?: number;
}

export const BunnyVideoPlayer = ({
    videoId,
    title,
    onEnd,
    className,
    initialTime = 0,
}: BunnyVideoPlayerProps) => {
    const [isReady, setIsReady] = useState(false);

    // Timeout fallback to ensure loader disappears even if onLoad fails
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isReady) {
                console.log('🐰 [BunnyVideoPlayer] Timeout triggered - forcing ready state');
                setIsReady(true);
            }
        }, 3000); // Force show after 3s
        return () => clearTimeout(timer);
    }, [isReady]);

    // Construct Bunny.net iframe URL
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&t=${initialTime}`;

    // Debug logging
    console.log('🐰 [BunnyVideoPlayer] Initializing:', {
        videoId,
        libraryId,
        embedUrl,
        title
    });

    return (
        <div className={cn("relative aspect-video bg-slate-900 rounded-lg overflow-hidden", className)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            )}

            <iframe
                src={embedUrl}
                title={title || "Video player"}
                className="absolute top-0 left-0 w-full h-full border-0"
                onLoad={() => {
                    console.log('🐰 [BunnyVideoPlayer] Iframe loaded');
                    setIsReady(true);
                }}
                loading="lazy"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};
