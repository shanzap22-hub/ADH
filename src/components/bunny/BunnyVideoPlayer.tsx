"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Declare Player.js type
declare global {
    interface Window {
        Player?: any;
    }
}

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
    const playerRef = useRef<any>(null);
    const hasEndedRef = useRef(false);
    const durationRef = useRef(0);
    const [playerJsLoaded, setPlayerJsLoaded] = useState(false);

    // Load Player.js library
    useEffect(() => {
        // Check if Player.js is already loaded
        if (window.Player) {
            console.log('🐰 [BunnyVideoPlayer] Player.js already loaded');
            setPlayerJsLoaded(true);
            return;
        }

        // Load Player.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/player.js@0.1.0/dist/player.min.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ [BunnyVideoPlayer] Player.js loaded successfully');
            setPlayerJsLoaded(true);
        };
        script.onerror = () => {
            console.error('❌ [BunnyVideoPlayer] Failed to load Player.js');
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup script if component unmounts before loading
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

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

    // Initialize Player.js when both iframe and library are ready
    useEffect(() => {
        if (!iframeRef.current || !playerJsLoaded || !window.Player || !onEnd) return;

        const iframe = iframeRef.current;

        // Wait for iframe to be fully loaded
        const initializePlayer = () => {
            try {
                console.log('🐰 [BunnyVideoPlayer] Initializing Player.js');

                // Create Player.js instance
                const player = new window.Player(iframe);
                playerRef.current = player;

                // Wait for player to be ready
                player.on('ready', () => {
                    console.log('✅ [BunnyVideoPlayer] Player is ready');

                    // Get duration
                    player.getDuration((duration: number) => {
                        durationRef.current = duration;
                        console.log(`📊 [BunnyVideoPlayer] Duration: ${duration}s`);
                    });

                    // Seek to initial time if provided
                    if (initialTime > 0) {
                        player.setCurrentTime(initialTime);
                        console.log(`⏩ [BunnyVideoPlayer] Seeking to ${initialTime}s`);
                    }
                });

                // Listen for timeupdate events
                player.on('timeupdate', (data: { seconds: number; duration: number }) => {
                    const currentTime = data.seconds;
                    const duration = data.duration;

                    // Update duration if available
                    if (duration && duration > 0) {
                        durationRef.current = duration;
                    }

                    // Calculate progress
                    if (durationRef.current > 0) {
                        const percentComplete = (currentTime / durationRef.current) * 100;

                        // Log every 10% progress for debugging
                        const roundedPercent = Math.floor(percentComplete);
                        if (roundedPercent % 10 === 0 && roundedPercent > 0) {
                            console.log(`🎬 [BunnyVideoPlayer] Progress: ${percentComplete.toFixed(1)}%`);
                        }

                        // Trigger completion at 95%
                        if (percentComplete >= 95 && !hasEndedRef.current) {
                            console.log('✅ [BunnyVideoPlayer] 95% complete - triggering completion');
                            hasEndedRef.current = true;
                            onEnd();
                        }
                    }
                });

                // Listen for ended event
                player.on('ended', () => {
                    if (!hasEndedRef.current) {
                        console.log('✅ [BunnyVideoPlayer] Video ENDED - triggering completion');
                        hasEndedRef.current = true;
                        onEnd();
                    }
                });

                console.log('✅ [BunnyVideoPlayer] Event listeners attached');

            } catch (error) {
                console.error('❌ [BunnyVideoPlayer] Player initialization error:', error);
            }
        };

        // Wait a bit for iframe to be fully ready
        const timer = setTimeout(initializePlayer, 1500);

        return () => {
            clearTimeout(timer);
            // Cleanup player
            if (playerRef.current) {
                try {
                    playerRef.current.off('timeupdate');
                    playerRef.current.off('ended');
                    playerRef.current.off('ready');
                } catch (e) {
                    // Ignore cleanup errors
                }
                playerRef.current = null;
            }
        };
    }, [playerJsLoaded, onEnd, videoId, initialTime]);

    // Reset state when video changes
    useEffect(() => {
        hasEndedRef.current = false;
        durationRef.current = 0;
    }, [videoId]);

    // Construct Bunny.net iframe URL
    const libraryId = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&preload=true&api=1`;

    console.log('🐰 [BunnyVideoPlayer] Rendering:', {
        videoId,
        libraryId,
        initialTime,
        title,
        playerJsLoaded,
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
