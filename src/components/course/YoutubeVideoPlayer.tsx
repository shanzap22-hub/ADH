"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Add global declaration for YT (YouTube API)
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: (() => void) | undefined;
    }
}

interface YoutubeVideoPlayerProps {
    videoId: string;
    initialTime?: number;
    onProgress?: (seconds: number) => void;
    onPause?: () => void;
    onEnd?: () => void;
    title?: string;
    className?: string;
}

export const YoutubeVideoPlayer = ({
    videoId,
    initialTime = 0,
    onProgress,
    onPause,
    onEnd,
    title,
    className
}: YoutubeVideoPlayerProps) => {
    const [isReady, setIsReady] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerPlaceholderRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Keep callback refs fresh to avoid restarting player on every render
    const onProgressRef = useRef(onProgress);
    const onPauseRef = useRef(onPause);
    const onEndRef = useRef(onEnd);

    useEffect(() => {
        onProgressRef.current = onProgress;
        onPauseRef.current = onPause;
        onEndRef.current = onEnd;
    }, [onProgress, onPause, onEnd]);

    const startProgressTracking = () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                const currentTime = playerRef.current.getCurrentTime();
                const duration = typeof playerRef.current.getDuration === "function" ? playerRef.current.getDuration() : 0;
                
                if (onProgressRef.current) {
                    onProgressRef.current(currentTime);
                }

                // If watched >= 95%, auto-trigger completion (just like Bunny player)
                if (duration > 0 && (currentTime / duration) >= 0.95) {
                    stopProgressTracking();
                    if (onEndRef.current) {
                        onEndRef.current();
                    }
                }
            }
        }, 1000); // 1 സെക്കൻഡിൽ പ്രോഗ്രസ്സ് ട്രാക്ക് ചെയ്യുന്നു
    };

    const stopProgressTracking = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    useEffect(() => {
        let isDestroyed = false;

        const initPlayer = () => {
            if (isDestroyed || !playerPlaceholderRef.current || !window.YT || !window.YT.Player) return;

            // Existing player ഉണ്ടെങ്കിൽ നശിപ്പിക്കുക
            if (playerRef.current) {
                try {
                    stopProgressTracking();
                    playerRef.current.destroy();
                } catch (e) {
                    console.warn("[YoutubePlayer] Error destroying old player:", e);
                }
                playerRef.current = null;
            }

            playerRef.current = new window.YT.Player(playerPlaceholderRef.current, {
                videoId: videoId,
                width: "100%",
                height: "100%",
                playerVars: {
                    autoplay: 0,
                    rel: 0,
                    modestbranding: 1,
                    fs: 1, // Fullscreen button enable ചെയ്യുക
                    playsinline: 1,
                    origin: typeof window !== "undefined" ? window.location.origin : ""
                },
                events: {
                    onReady: (event: any) => {
                        if (isDestroyed) return;
                        setIsReady(true);
                        // initialTime ഉണ്ടെങ്കിൽ അങ്ങോട്ട് seek ചെയ്യുക
                        if (initialTime > 0) {
                            event.target.seekTo(initialTime, true);
                        }
                    },
                    onStateChange: (event: any) => {
                        if (isDestroyed) return;
                        
                        // YT.PlayerState.PLAYING = 1
                        // YT.PlayerState.PAUSED = 2
                        // YT.PlayerState.ENDED = 0
                        const state = event.data;
                        if (state === 1) {
                            startProgressTracking();
                        } else {
                            stopProgressTracking();
                            if (state === 2) {
                                if (onPauseRef.current) onPauseRef.current();
                            } else if (state === 0) {
                                if (onEndRef.current) onEndRef.current();
                            }
                        }
                    }
                }
            });
        };

        const setupApiAndInit = () => {
            if (window.YT && window.YT.Player) {
                initPlayer();
            } else {
                // Global callback for YT Iframe API Ready event
                const previousCallback = window.onYouTubeIframeAPIReady;
                window.onYouTubeIframeAPIReady = () => {
                    if (previousCallback) previousCallback();
                    window.dispatchEvent(new Event("youtubeApiReady"));
                };

                // Script load ചെയ്യാൻ
                const scriptId = "youtube-iframe-api";
                let script = document.getElementById(scriptId) as HTMLScriptElement;
                if (!script) {
                    script = document.createElement("script");
                    script.id = scriptId;
                    script.src = "https://www.youtube.com/iframe_api";
                    document.body.appendChild(script);
                }

                window.addEventListener("youtubeApiReady", initPlayer);
            }
        };

        setupApiAndInit();

        return () => {
            isDestroyed = true;
            stopProgressTracking();
            window.removeEventListener("youtubeApiReady", initPlayer);
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // Ignore
                }
                playerRef.current = null;
            }
        };
    }, [videoId]); // videoId മാറുമ്പോൾ മാത്രം പ്ലെയർ റീ-ഇനീഷ്യലൈസ് ചെയ്യുന്നു

    return (
        <div ref={containerRef} className={cn("relative w-full h-full bg-slate-900", className)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        <p className="text-slate-400 text-xs font-medium">Loading YouTube Stream...</p>
                    </div>
                </div>
            )}
            {/* YouTube API ഈ placeholder div-നെ iframe വെച്ച് replace ചെയ്യും */}
            <div ref={playerPlaceholderRef} className="w-full h-full" />
        </div>
    );
};
