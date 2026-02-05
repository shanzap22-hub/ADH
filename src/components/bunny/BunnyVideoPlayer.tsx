"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MetaballLoader } from "@/components/ui/metaball-loader";

// Add global declaration for playerjs
declare global {
    interface Window {
        playerjs: any;
    }
}

interface BunnyVideoPlayerProps {
    videoId: string;
    title?: string;
    onEnd?: () => void;
    onProgress?: (seconds: number) => void;
    className?: string;
    initialTime?: number;
}

export const BunnyVideoPlayer = ({
    videoId,
    title,
    onEnd,
    onProgress,
    className,
    initialTime = 0,
}: BunnyVideoPlayerProps) => {
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

    if (!libraryId) {
        console.error("[BunnyPlayer] Missing NEXT_PUBLIC_BUNNY_LIBRARY_ID");
        return (
            <div className={cn("relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900", className)}>
                <div className="text-center p-4">
                    <p className="font-bold">Configuration Error</p>
                    <p className="text-sm">Video Library ID is missing.</p>
                </div>
            </div>
        );
    }

    // Memoize the embed URL to prevent iframe reloading on prop changes (like initialTime updates)
    // We only update this when videoId changes.
    const [embedUrl, setEmbedUrl] = useState(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&context=adh-player`);

    const [isReady, setIsReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    // Use refs for callbacks to avoid stale closures in event listeners
    const onEndRef = useRef(onEnd);
    const onProgressRef = useRef(onProgress);
    const hasEndedRef = useRef(false);

    // STRICT INITIALIZATION CONTROL
    // We use a ref to track if we have already performed the initial seek for the current video.
    // This prevents "looping" or "jumping" back if initialTime prop updates during playback.
    const isInitialTimeSetRef = useRef(false);
    const initialTimeRef = useRef(initialTime);

    // Keep initialTimeRef updated with the latest prop value
    // This allows us to read the correct time inside the 'ready' callback without
    // triggering the useEffect to re-run.
    useEffect(() => {
        initialTimeRef.current = initialTime;
    }, [initialTime]);

    useEffect(() => {
        onEndRef.current = onEnd;
    }, [onEnd]);

    useEffect(() => {
        onProgressRef.current = onProgress;
    }, [onProgress]);

    // Reset state when VIDEO ID changes
    useEffect(() => {
        hasEndedRef.current = false;
        isInitialTimeSetRef.current = false; // Reset the seek flag for the new video
        setIsReady(false);
        setEmbedUrl(`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&context=adh-player`);

        // Note: we don't reset playerRef here, handled in cleanup of init effect or by re-init logic
    }, [videoId, libraryId]);

    const handleCompletion = useCallback(() => {
        if (!hasEndedRef.current) {
            console.log("[BunnyPlayer] Video completed via SDK event");
            hasEndedRef.current = true;
            if (onEndRef.current) {
                try {
                    onEndRef.current();
                } catch (err) {
                    console.error("[BunnyPlayer] Error in onEnd callback:", err);
                }
            }
        }
    }, []);

    // Load player.js script and initialize player
    useEffect(() => {
        const scriptId = "bunny-player-sdk";
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
            script.async = true;
            document.body.appendChild(script);
        }

        const initPlayer = () => {
            if (window.playerjs && iframeRef.current) {
                // Initialize player only if not already initialized or if iframe changed
                // (Checking playerRef.current.element ensures we aren't re-wrapping the same iframe)
                if (!playerRef.current || playerRef.current.element !== iframeRef.current) {
                    try {
                        const player = new window.playerjs.Player(iframeRef.current);
                        playerRef.current = player;

                        player.on('ready', () => {
                            console.log("[BunnyPlayer] SDK Ready");
                            setIsReady(true);

                            // ---------------------------------------------------------
                            // STRICT SEEK LOGIC
                            // ---------------------------------------------------------
                            // Only seek if we haven't done so for this video session.
                            // We use the Ref value to get the startup time.
                            if (!isInitialTimeSetRef.current) {
                                const t = initialTimeRef.current;
                                if (t > 0) {
                                    console.log("[BunnyPlayer] Seeking to initial time (once):", t);
                                    player.setCurrentTime(t);
                                }
                                isInitialTimeSetRef.current = true;
                            }
                            // ---------------------------------------------------------
                        });

                        player.on('timeupdate', (data: any) => {
                            if (data.seconds && data.duration) {
                                // Calls onProgress via Ref to avoid closure staleness
                                if (onProgressRef.current) {
                                    // Pass float seconds, parent can floor it if needed
                                    onProgressRef.current(data.seconds);
                                }

                                const percent = (data.seconds / data.duration) * 100;
                                if (percent >= 95) {
                                    handleCompletion();
                                }
                            }
                        });

                        player.on('ended', () => {
                            console.log("[BunnyPlayer] SDK Ended event");
                            handleCompletion();
                        });

                        player.on('error', (error: any) => {
                            console.error("[BunnyPlayer] SDK Error:", error);
                        });

                    } catch (e) {
                        console.error("[BunnyPlayer] Initialization failed:", e);
                    }
                }
            }
        };

        if (window.playerjs) {
            initPlayer();
        } else {
            script.addEventListener("load", initPlayer);
        }

        return () => {
            script.removeEventListener("load", initPlayer);
            if (playerRef.current) {
                playerRef.current = null;
            }
        };
    }, [videoId, handleCompletion]);

    return (
        <div className={cn("relative aspect-video bg-slate-900 rounded-lg overflow-hidden", className)}>
            {!isReady && (
                <MetaballLoader className="absolute inset-0 z-10" />
            )}

            <iframe
                ref={iframeRef}
                src={embedUrl}
                title={title || "Video player"}
                className="absolute top-0 left-0 w-full h-full border-0"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; clipboard-write"
                allowFullScreen
            />
        </div>
    );
};
