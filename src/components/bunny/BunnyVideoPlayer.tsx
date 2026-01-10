"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hasEndedRef = useRef(false);
    const durationRef = useRef<number>(0);
    const currentTimeRef = useRef<number>(0);

    // To handle initial seek only once
    const initialSeekAttempted = useRef(false);

    // Reset state when video changes
    useEffect(() => {
        hasEndedRef.current = false;
        durationRef.current = 0;
        currentTimeRef.current = 0;
        initialSeekAttempted.current = false;
        setIsReady(false);
    }, [videoId]);

    // Function to trigger completion
    const triggerCompletion = useCallback(() => {
        if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            if (onEnd) onEnd();
        }
    }, [onEnd]);

    // Handle messages from the iframe
    const handleMessage = useCallback((event: MessageEvent) => {
        // Parse data safely
        let data = event.data;
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                return; // Ignore non-JSON messages
            }
        }

        if (!data) return;

        // 1. Ready / Playing
        if (data.event === 'ready' || data.event === 'video.playing') {
            if (!isReady) setIsReady(true);

            // Handle initial seek
            if (initialTime > 0 && !initialSeekAttempted.current && iframeRef.current) {
                iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                    command: 'seek',
                    value: initialTime
                }), '*');
                initialSeekAttempted.current = true;
            }
        }

        // 2. Duration
        if (data.event === 'duration') {
            durationRef.current = Number(data.value);
        }

        // 3. Time Update / Progress
        if (data.event === 'timeupdate' || (data.event === 'current_time' && data.value)) {
            const time = Number(data.value) || Number(data.currentTime);

            if (!isNaN(time) && time > 0) {
                currentTimeRef.current = time;

                // Calculate percentage
                if (durationRef.current > 0) {
                    const percent = (currentTimeRef.current / durationRef.current) * 100;

                    // Trigger at 95%
                    if (percent >= 95) {
                        triggerCompletion();
                    }
                }
            }
        }

        // 4. Create explicit ended handler
        if (data.event === 'ended') {
            triggerCompletion();
        }

    }, [initialTime, triggerCompletion, isReady]);

    // Attach global message listener
    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    // Polling mechanism (Fallback)
    // We explicitly ask for time and duration every second to ensure reliability
    useEffect(() => {
        const interval = setInterval(() => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(JSON.stringify({ command: 'getDuration' }), '*');
                iframeRef.current.contentWindow.postMessage(JSON.stringify({ command: 'getCurrentTime' }), '*');
            }
        }, 1000); // 1 second interval

        return () => clearInterval(interval);
    }, []);

    // Construct Embed URL
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    // api=1 is CRITICAL for postMessage support
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&api=1`;

    return (
        <div className={cn("relative aspect-video bg-slate-900 rounded-lg overflow-hidden", className)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            )}

            <iframe
                ref={iframeRef}
                src={embedUrl}
                title={title || "Video player"}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};
