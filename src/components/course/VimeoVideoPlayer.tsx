"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Add global declaration for Vimeo SDK
declare global {
    interface Window {
        Vimeo: any;
    }
}

interface VimeoVideoPlayerProps {
    videoId: string;
    initialTime?: number;
    onProgress?: (seconds: number) => void;
    onPause?: () => void;
    onEnd?: () => void;
    title?: string;
    className?: string;
}

export const VimeoVideoPlayer = ({
    videoId,
    initialTime = 0,
    onProgress,
    onPause,
    onEnd,
    title,
    className
}: VimeoVideoPlayerProps) => {
    const [isReady, setIsReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    // Keep callback refs fresh
    const onProgressRef = useRef(onProgress);
    const onPauseRef = useRef(onPause);
    const onEndRef = useRef(onEnd);

    useEffect(() => {
        onProgressRef.current = onProgress;
        onPauseRef.current = onPause;
        onEndRef.current = onEnd;
    }, [onProgress, onPause, onEnd]);

    useEffect(() => {
        let isDestroyed = false;

        const initPlayer = () => {
            if (isDestroyed || !iframeRef.current || !window.Vimeo || !window.Vimeo.Player) return;

            // Existing player ഉണ്ടെങ്കിൽ നശിപ്പിക്കുക
            if (playerRef.current) {
                try {
                    playerRef.current.off("timeupdate");
                    playerRef.current.off("pause");
                    playerRef.current.off("ended");
                } catch (e) {
                    console.warn("[VimeoPlayer] Error cleanup:", e);
                }
                playerRef.current = null;
            }

            const player = new window.Vimeo.Player(iframeRef.current);
            playerRef.current = player;

            player.ready().then(() => {
                if (isDestroyed) return;
                setIsReady(true);
                if (initialTime > 0) {
                    player.setCurrentTime(initialTime).catch(() => {});
                }
            }).catch((err: any) => {
                console.error("[VimeoPlayer] Ready failed:", err);
                setIsReady(true); // Fallback to show player anyway
            });

            player.on("timeupdate", (data: any) => {
                if (isDestroyed) return;
                if (onProgressRef.current) {
                    onProgressRef.current(data.seconds);
                }
            });

            player.on("pause", () => {
                if (isDestroyed) return;
                if (onPauseRef.current) onPauseRef.current();
            });

            player.on("ended", () => {
                if (isDestroyed) return;
                if (onEndRef.current) onEndRef.current();
            });
        };

        const setupApiAndInit = () => {
            if (window.Vimeo && window.Vimeo.Player) {
                initPlayer();
            } else {
                const scriptId = "vimeo-player-sdk";
                let script = document.getElementById(scriptId) as HTMLScriptElement;
                if (!script) {
                    script = document.createElement("script");
                    script.id = scriptId;
                    script.src = "https://player.vimeo.com/api/player.js";
                    document.body.appendChild(script);
                }
                script.addEventListener("load", initPlayer);
            }
        };

        setupApiAndInit();

        return () => {
            isDestroyed = true;
            if (playerRef.current) {
                try {
                    playerRef.current.off("timeupdate");
                    playerRef.current.off("pause");
                    playerRef.current.off("ended");
                } catch (e) {
                    // Ignore
                }
                playerRef.current = null;
            }
        };
    }, [videoId]); // videoId മാറുമ്പോൾ മാത്രം പ്ലെയർ റീ-ഇനീഷ്യലൈസ് ചെയ്യുന്നു

    // Vimeo Embed URL
    const embedUrl = `https://player.vimeo.com/video/${videoId}?api=1&player_id=vimeo-player-${videoId}&title=0&byline=0&portrait=0`;

    return (
        <div className={cn("relative w-full h-full bg-slate-900", className)}>
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 animate-pulse">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        <p className="text-slate-400 text-xs font-medium">Loading Vimeo Stream...</p>
                    </div>
                </div>
            )}
            <iframe
                ref={iframeRef}
                src={embedUrl}
                title={title || "Vimeo Player"}
                className={cn("w-full h-full border-0 transition-opacity duration-300", !isReady ? "opacity-0" : "opacity-100")}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
};
