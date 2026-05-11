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
    courseId?: string; // Signed URL access check-ന് ആവശ്യം
    title?: string;
    onEnd?: () => void;
    onProgress?: (seconds: number) => void;
    className?: string;
    initialTime?: number;
}

export const BunnyVideoPlayer = ({
    videoId,
    courseId,
    title,
    onEnd,
    onProgress,
    className,
    initialTime = 0,
}: BunnyVideoPlayerProps) => {
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;

    // Signed URL server-ൽ നിന്ന് fetch ചെയ്യുന്നു (piracy protection)
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [urlError, setUrlError] = useState<string | null>(null);

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

    // Server-ൽ നിന്ന് signed URL fetch ചെയ്യുക
    const fetchSignedUrl = useCallback(async (vid: string) => {
        try {
            setEmbedUrl(null);
            setUrlError(null);
            setIsReady(false);

            const params = new URLSearchParams({ videoId: vid });
            if (courseId) params.set("courseId", courseId);

            const res = await fetch(`/api/video/signed-url?${params.toString()}`);
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setEmbedUrl(data.url);
        } catch (err: any) {
            console.error("[BunnyPlayer] Signed URL fetch failed:", err);
            setUrlError(err.message || "Failed to load video");
            
            // Fallback: unsigned URL ഉപയോഗിക്കുക (BUNNY_STREAM_TOKEN_KEY configure ചെയ്തിട്ടില്ലെങ്കിൽ)
            if (libraryId) {
                setEmbedUrl(`https://iframe.mediadelivery.net/embed/${libraryId}/${vid}?autoplay=false&preload=true`);
                setUrlError(null);
            }
        }
    }, [courseId, libraryId]);

    // Video ID change ആകുമ്പോൾ new signed URL fetch ചെയ്യുക
    const [prevVideoId, setPrevVideoId] = useState(videoId);
    if (videoId !== prevVideoId) {
        setPrevVideoId(videoId);
        fetchSignedUrl(videoId);
    }

    // Initial load-ൽ signed URL fetch ചെയ്യുക
    useEffect(() => {
        fetchSignedUrl(videoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        if (!embedUrl) return;
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
    }, [embedUrl, handleCompletion]);

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
        <div className={cn("relative aspect-video bg-slate-900 rounded-2xl overflow-hidden group", className)}>
            {/* Cinematic skeleton instead of MetaballLoader */}
            {!isReady && !urlError && (
                <div className="absolute inset-0 z-10 bg-slate-900 animate-pulse flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                        <p className="text-slate-400 text-xs font-medium animate-pulse">Initializing Secure Player...</p>
                    </div>
                </div>
            )}

            {/* Detailed Error State */}
            {urlError && (
                <div className="absolute inset-0 z-20 bg-slate-950/90 flex items-center justify-center p-6 text-center backdrop-blur-sm">
                    <div className="max-w-md space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                            <span className="text-red-500 text-2xl">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">Playback Blocked</h3>
                            <p className="text-slate-400 text-sm mt-1">{urlError}</p>
                            <p className="text-slate-500 text-[10px] mt-4 uppercase tracking-widest">Security: Signed URL Required</p>
                        </div>
                        <button 
                            onClick={() => fetchSignedUrl(videoId)}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition-all border border-white/10"
                        >
                            Retry Loading
                        </button>
                    </div>
                </div>
            )}

            {embedUrl && (
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title={title || "Video player"}
                    className={cn("absolute top-0 left-0 w-full h-full border-0 transition-opacity duration-700", (!isReady || !!urlError) ? "opacity-0" : "opacity-100")}
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; clipboard-write"
                    allowFullScreen
                />
            )}
            
            {/* Overlay for Branding or Metadata */}
            {isReady && !urlError && (
                <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white border border-white/10 uppercase tracking-widest">
                        ADH Secure Stream
                    </span>
                </div>
            )}
        </div>
    );
};
