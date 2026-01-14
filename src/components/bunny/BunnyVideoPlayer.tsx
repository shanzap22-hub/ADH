"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [isReady, setIsReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    // Use refs for callbacks to avoid stale closures in event listeners
    const onEndRef = useRef(onEnd);
    const onProgressRef = useRef(onProgress);
    const hasEndedRef = useRef(false);

    useEffect(() => {
        onEndRef.current = onEnd;
    }, [onEnd]);

    useEffect(() => {
        onProgressRef.current = onProgress;
    }, [onProgress]);

    // Reset loop ref when video changes
    useEffect(() => {
        hasEndedRef.current = false;
        setIsReady(false);
    }, [videoId]);

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
                // Check if playerRef.current is null OR if the iframe source has changed (implies new videoId)
                if (!playerRef.current || playerRef.current.element !== iframeRef.current) {
                    try {
                        const player = new window.playerjs.Player(iframeRef.current);
                        playerRef.current = player;

                        player.on('ready', () => {
                            console.log("[BunnyPlayer] SDK Ready");
                            setIsReady(true);
                            if (initialTime > 0) {
                                player.setCurrentTime(initialTime);
                            }
                        });

                        player.on('timeupdate', (data: any) => {
                            // data.seconds and data.duration
                            if (data.seconds && data.duration) {
                                // Calls onProgress via Ref to avoid closure staleness
                                if (onProgressRef.current) {
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
            // We generally don't destroy the player instance explicitly as per lightweight usage, 
            // from Bunny docs.
            if (playerRef.current) {
                playerRef.current = null;
            }
        };
    }, [videoId, initialTime, handleCompletion]);

    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&context=adh-player`;

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
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; clipboard-write"
                allowFullScreen
            />
        </div>
    );
};
