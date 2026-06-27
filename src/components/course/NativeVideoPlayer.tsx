"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NativeVideoPlayerProps {
    src: string;
    initialTime?: number;
    onProgress?: (seconds: number) => void;
    onPause?: () => void;
    onEnd?: () => void;
    className?: string;
}

export const NativeVideoPlayer = ({
    src,
    initialTime = 0,
    onProgress,
    onPause,
    onEnd,
    className
}: NativeVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isReady, setIsReady] = useState(false);
    const initialSeekDoneRef = useRef(false);

    useEffect(() => {
        initialSeekDoneRef.current = false;
        setIsReady(false);
    }, [src]);

    const handleLoadedMetadata = () => {
        setIsReady(true);
        if (videoRef.current && !initialSeekDoneRef.current && initialTime > 0) {
            videoRef.current.currentTime = initialTime;
            initialSeekDoneRef.current = true;
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && isReady) {
            const currentTime = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            onProgress?.(currentTime);
            
            // If watched >= 95%, auto-trigger completion (just like Bunny player)
            if (duration > 0 && (currentTime / duration) >= 0.95) {
                onEnd?.();
            }
        }
    };

    return (
        <div className={cn("relative w-full h-full bg-slate-900", className)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        <p className="text-slate-400 text-xs font-medium">Loading Video Stream...</p>
                    </div>
                </div>
            )}
            <video
                ref={videoRef}
                src={src}
                className={cn("w-full h-full object-contain transition-opacity duration-300", !isReady ? "opacity-0" : "opacity-100")}
                controls
                controlsList="nodownload"
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPause={onPause}
                onEnded={onEnd}
            />
        </div>
    );
};
