"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BunnyVideoPlayerProps {
    videoId: string;
    title?: string;
    onEnd?: () => void;
    className?: string;
}

export const BunnyVideoPlayer = ({
    videoId,
    title,
    onEnd,
    className,
}: BunnyVideoPlayerProps) => {
    const [isReady, setIsReady] = useState(false);

    // Construct Bunny.net iframe URL
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true`;

    return (
        <div className={cn("relative aspect-video bg-slate-900 rounded-lg overflow-hidden", className)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            )}

            <iframe
                src={embedUrl}
                title={title || "Video player"}
                className={cn(
                    "absolute top-0 left-0 w-full h-full border-0",
                    !isReady && "hidden"
                )}
                onLoad={() => setIsReady(true)}
                loading="lazy"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
            />

            {/* Note: Bunny.net iframe doesn't support onEnded callback, 
                so manual completion button should be shown in parent component if needed */}
        </div>
    );
};
