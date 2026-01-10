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
    const lastTimeRef = useRef(0);
    const durationRef = useRef(0);

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

    // Subscribe to Bunny Stream events when iframe is ready
    useEffect(() => {
        if (!iframeRef.current || !onEnd) return;

        const iframe = iframeRef.current;

        // Wait for iframe to load, then subscribe to events
        const setupEventSubscription = () => {
            console.log('🐰 [BunnyVideoPlayer] Setting up event subscriptions');

            try {
                // Subscribe to timeupdate events for progress tracking
                iframe.contentWindow?.postMessage(
                    JSON.stringify({
                        method: 'addEventListener',
                        value: 'timeupdate'
                    }),
                    '*'
                );

                // Subscribe to ended event
                iframe.contentWindow?.postMessage(
                    JSON.stringify({
                        method: 'addEventListener',
                        value: 'ended'
                    }),
                    '*'
                );

                // Subscribe to loadedmetadata to get duration
                iframe.contentWindow?.postMessage(
                    JSON.stringify({
                        method: 'addEventListener',
                        value: 'loadedmetadata'
                    }),
                    '*'
                );

                console.log('✅ [BunnyVideoPlayer] Event subscriptions sent');
            } catch (error) {
                console.error('🐰 [BunnyVideoPlayer] Subscription error:', error);
            }
        };

        // Setup subscriptions after iframe loads
        const timer = setTimeout(setupEventSubscription, 2000);

        return () => clearTimeout(timer);
    }, [onEnd, videoId]);

    // Listen for postMessage events from Bunny iframe
    useEffect(() => {
        if (!onEnd) return;

        const handleMessage = (event: MessageEvent) => {
            // Only process messages from Bunny.net
            if (!event.origin.includes('mediadelivery.net')) return;

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                // Log all events for debugging
                if (data.event) {
                    console.log('🐰 [BunnyVideoPlayer] Event received:', data.event, data);
                }

                // Handle ended event
                if (data.event === 'ended' && !hasEndedRef.current) {
                    console.log('✅ [BunnyVideoPlayer] Video ENDED - triggering completion');
                    hasEndedRef.current = true;
                    onEnd();
                    return;
                }

                // Handle loadedmetadata to get duration
                if (data.event === 'loadedmetadata') {
                    if (data.duration) {
                        durationRef.current = data.duration;
                        console.log(`📊 [BunnyVideoPlayer] Duration set: ${data.duration}s`);
                    }
                }

                // Handle timeupdate for progress tracking
                if (data.event === 'timeupdate') {
                    const currentTime = data.currentTime;

                    if (currentTime !== undefined) {
                        lastTimeRef.current = currentTime;

                        // Update duration if available
                        if (data.duration) {
                            durationRef.current = data.duration;
                        }

                        // Calculate progress if we have duration
                        if (durationRef.current > 0) {
                            const percentComplete = (currentTime / durationRef.current) * 100;

                            // Log every 10% progress
                            if (Math.floor(percentComplete) % 10 === 0 && Math.floor(percentComplete) > 0) {
                                console.log(`🎬 [BunnyVideoPlayer] Progress: ${percentComplete.toFixed(1)}%`);
                            }

                            // Trigger completion at 95%
                            if (percentComplete >= 95 && !hasEndedRef.current) {
                                console.log('✅ [BunnyVideoPlayer] 95% complete - triggering completion');
                                hasEndedRef.current = true;
                                onEnd();
                            }
                        }
                    }
                }

            } catch (error) {
                // Silently ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [onEnd]);

    // Reset state when video changes
    useEffect(() => {
        hasEndedRef.current = false;
        lastTimeRef.current = 0;
        durationRef.current = 0;
    }, [videoId]);

    // Construct Bunny.net iframe URL with API enabled
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&t=${initialTime}&api=1`;

    console.log('🐰 [BunnyVideoPlayer] Initializing:', {
        videoId,
        libraryId,
        initialTime,
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
