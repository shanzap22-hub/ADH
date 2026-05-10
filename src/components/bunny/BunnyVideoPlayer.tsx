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

    // Memoize the embed URL to use the NEW Bunny Player hostname
    const [embedUrl, setEmbedUrl] = useState(`https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true`);

    const [isReady, setIsReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    const onEndRef = useRef(onEnd);
    const onProgressRef = useRef(onProgress);
    const hasEndedRef = useRef(false);
    const isInitialTimeSetRef = useRef(false);
    const initialTimeRef = useRef(initialTime);

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
    const [prevVideoId, setPrevVideoId] = useState(videoId);
    if (videoId !== prevVideoId) {
        setPrevVideoId(videoId);
        setIsReady(false);
        if (libraryId) {
            setEmbedUrl(`https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true`);
        }
    }

    useEffect(() => {
        hasEndedRef.current = false;
        isInitialTimeSetRef.current = false;
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

    useEffect(() => {
        if (!libraryId) return;
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
                if (!playerRef.current || playerRef.current.element !== iframeRef.current) {
                    try {
                        const player = new window.playerjs.Player(iframeRef.current);
                        playerRef.current = player;

                        player.on('ready', () => {
                            setIsReady(true);
                            if (!isInitialTimeSetRef.current) {
                                const t = initialTimeRef.current;
                                if (t > 0) {
                                    player.setCurrentTime(t);
                                }
                                isInitialTimeSetRef.current = true;
                            }
                        });

                        player.on('timeupdate', (data: any) => {
                            if (data.seconds && data.duration) {
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
    }, [videoId, handleCompletion, libraryId]);

    if (!libraryId) {
        return (
            <div className={cn("relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900", className)}>
                <div className="text-center p-4">
                    <p className="font-bold">Configuration Error</p>
                    <p className="text-sm">Video Library ID is missing.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("relative aspect-video bg-slate-900 rounded-2xl overflow-hidden", className)}>
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
