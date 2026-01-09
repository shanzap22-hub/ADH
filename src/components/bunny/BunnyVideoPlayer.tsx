"use client";

import { useState, useEffect, useRef } from "react";
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
    const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timeout fallback to ensure loader disappears
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isReady) {
                console.log('🐰 [BunnyVideoPlayer] Timeout - forcing ready state');
                setIsReady(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [isReady]);

    // Polling mechanism to check video progress via iframe communication
    useEffect(() => {
        if (!onEnd || !iframeRef.current) return;

        console.log('🐰 [BunnyVideoPlayer] Setting up polling for video completion');

        // Start polling after iframe loads
        const startPolling = () => {
            if (checkIntervalRef.current) return; // Already polling

            checkIntervalRef.current = setInterval(() => {
                if (!iframeRef.current || hasEndedRef.current) return;

                try {
                    // Request current time from iframe
                    iframeRef.current.contentWindow?.postMessage(
                        JSON.stringify({ method: 'getCurrentTime' }),
                        '*'
                    );
                    iframeRef.current.contentWindow?.postMessage(
                        JSON.stringify({ method: 'getDuration' }),
                        '*'
                    );
                } catch (error) {
                    console.error('🐰 [BunnyVideoPlayer] Polling error:', error);
                }
            }, 2000); // Check every 2 seconds
        };

        // Start polling after a delay
        const pollingTimer = setTimeout(startPolling, 3000);

        return () => {
            clearTimeout(pollingTimer);
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current);
                checkIntervalRef.current = null;
            }
        };
    }, [onEnd]);

    // Listen for postMessage events from Bunny iframe
    useEffect(() => {
        if (!onEnd) return;

        const handleMessage = (event: MessageEvent) => {
            // Only process messages from Bunny.net
            if (!event.origin.includes('mediadelivery.net')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                console.log('🐰 [BunnyVideoPlayer] Received message:', data);

                // Check for ended event
                if ((data.event === 'ended' || data.method === 'ended') && !hasEndedRef.current) {
                    console.log('✅ [BunnyVideoPlayer] Video ENDED - triggering completion');
                    hasEndedRef.current = true;
                    onEnd();
                    return;
                }

                // Check for time update with progress calculation
                if (data.event === 'timeupdate' || data.method === 'timeupdate') {
                    const currentTime = data.value?.currentTime || data.currentTime;
                    const duration = data.value?.duration || data.duration;

                    if (currentTime && duration) {
                        const percentComplete = (currentTime / duration) * 100;
                        console.log(`🎬 [BunnyVideoPlayer] Progress: ${percentComplete.toFixed(1)}%`);

                        if (percentComplete >= 95 && !hasEndedRef.current) {
                            console.log('✅ [BunnyVideoPlayer] 95% complete - triggering completion');
                            hasEndedRef.current = true;
                            onEnd();
                        }
                    }
                }

                // Handle getCurrentTime response
                if (data.method === 'getCurrentTime' && data.value !== undefined) {
                    console.log(`⏱️ [BunnyVideoPlayer] Current time: ${data.value}s`);
                }

            } catch (error) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onEnd]);

    // Reset hasEnded when video changes
    useEffect(() => {
        hasEndedRef.current = false;
    }, [videoId]);

    // Construct Bunny.net iframe URL with API enabled
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&t=${initialTime}&api=1`;

    console.log('🐰 [BunnyVideoPlayer] Initializing:', {
        videoId,
        libraryId,
        embedUrl,
        title,
        hasOnEndCallback: !!onEnd
    });

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
