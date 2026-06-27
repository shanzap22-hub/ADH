"use client";

import { BookOpen, File, CheckCircle, Loader2, Link2, ChevronLeft, ChevronRight } from "lucide-react";
import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";
import { YoutubeVideoPlayer } from "@/components/course/YoutubeVideoPlayer";
import { VimeoVideoPlayer } from "@/components/course/VimeoVideoPlayer";
import { NativeVideoPlayer } from "@/components/course/NativeVideoPlayer";
import { Button } from "@/components/ui/button";
import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { updateChapterProgress } from "@/actions/update-progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getVideoEmbedUrl, getVideoType, extractYouTubeId } from "@/lib/video-utils";
import { useFullscreenOrientation } from "@/hooks/useFullscreenOrientation";


interface LessonViewerProps {
    courseId?: string;
    chapterId?: string;
    unitId?: string;          // Unit ID — needed for accurate resume per unit
    title: string;
    description: string | null;
    videoUrl: string | null;
    lessonNumber: number;
    isCompleted?: boolean;
    lastPlayedSecond?: number;
    attachments?: { id: string; name: string; url: string }[];
    onComplete?: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
}

export const LessonViewer = ({
    courseId,
    chapterId,
    unitId,
    title,
    description,
    videoUrl,
    lessonNumber,
    isCompleted,
    lastPlayedSecond = 0,
    attachments = [],
    onComplete,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false
}: LessonViewerProps) => {
    // 1. Clean the URL (remove spaces/newlines)
    const cleanUrl = videoUrl ? videoUrl.trim() : null;
    const [isLoading, startTransition] = useTransition();
    const router = useRouter();
    const [isDesktop, setIsDesktop] = useState(false);

    // Video wrapper container ref for handling fullscreen screen orientation changes
    const videoContainerRef = useRef<HTMLDivElement>(null);
    useFullscreenOrientation(videoContainerRef, cleanUrl);

    const currentProgressSecondsRef = useRef<number>(0);
    const lastDbSaveTimeRef = useRef<number>(0);
    const lastSavedValueRef = useRef<number>(0);

    const [initialTime, setInitialTime] = useState<number>(0);
    const [isTimeLoaded, setIsTimeLoaded] = useState(false);

    // Local storage key helper
    const getStorageKey = useCallback(() => {
        return `progress-${courseId}-${chapterId}-${unitId || "default"}`;
    }, [courseId, chapterId, unitId]);

    // Page load-ൽ local storage-ൽ നിന്ന് saved progress വായിക്കുക (അല്ലെങ്കിൽ database value)
    useEffect(() => {
        const storageKey = getStorageKey();
        const localTime = localStorage.getItem(storageKey);
        if (localTime) {
            const parsedTime = parseInt(localTime, 10);
            setInitialTime(parsedTime);
            currentProgressSecondsRef.current = parsedTime;
            lastSavedValueRef.current = parsedTime;
        } else {
            setInitialTime(lastPlayedSecond || 0);
            currentProgressSecondsRef.current = lastPlayedSecond || 0;
            lastSavedValueRef.current = lastPlayedSecond || 0;
        }
        setIsTimeLoaded(true);
    }, [courseId, chapterId, unitId, lastPlayedSecond, getStorageKey]);

    // Supabase ഡാറ്റാബേസിലേക്ക് progress sync ചെയ്യുക
    const syncProgressToDb = useCallback(async (seconds: number) => {
        if (!courseId || !chapterId) return;
        const sec = Math.floor(seconds);
        
        // ഒരേ സെക്കൻഡ് വീണ്ടും വീണ്ടും ഡാറ്റാബേസിലേക്ക് അയക്കുന്നത് തടയുക
        if (sec === lastSavedValueRef.current) return;
        
        lastSavedValueRef.current = sec;
        lastDbSaveTimeRef.current = Date.now();
        
        try {
            await updateChapterProgress(courseId, chapterId, { lastPlayedSecond: sec, unitId });
        } catch (error) {
            console.warn("[LessonViewer] Supabase sync failed:", error);
        }
    }, [courseId, chapterId, unitId]);
    // വീഡിയോ കണ്ടുകൊണ്ടിരിക്കുമ്പോൾ വിളിക്കുന്ന ഫംഗ്ഷൻ (Optimized: No background DB write timer to prevent Supabase overuse)
    const handleProgress = useCallback((seconds: number) => {
        currentProgressSecondsRef.current = seconds;
        
        // 1. ലോക്കൽ മെമ്മറിയിൽ ഉടനടി സേവ് ചെയ്യുന്നു (lag-free)
        if (typeof window !== "undefined") {
            localStorage.setItem(getStorageKey(), Math.floor(seconds).toString());
        }
    }, [getStorageKey]);

    // വീഡിയോ pause ചെയ്യുമ്പോൾ ഉടൻ തന്നെ ഡാറ്റാബേസിലേക്ക് സിങ്ക് ചെയ്യുന്നു
    const handlePause = useCallback(() => {
        syncProgressToDb(currentProgressSecondsRef.current);
    }, [syncProgressToDb]);

    // വീഡിയോ തീരുമ്പോൾ ചെയ്യുന്ന കാര്യങ്ങൾ
    const handleEnd = useCallback(async () => {
        // local storage ഡാറ്റ ഡിലീറ്റ് ചെയ്യുക
        if (typeof window !== "undefined") {
            localStorage.removeItem(getStorageKey());
        }
        
        // അവസാന പ്രോഗ്രസ്സ് ഡാറ്റാബേസിലേക്ക് സിങ്ക് ചെയ്യുക
        await syncProgressToDb(currentProgressSecondsRef.current);

        // Lesson completed എന്ന് ഡാറ്റാബേസിൽ രേഖപ്പെടുത്തുക
        if (courseId && chapterId && !isCompleted) {
            try {
                await updateChapterProgress(courseId, chapterId, { isCompleted: true, unitId });
                toast.success("Lesson completed!");
                if (onComplete) onComplete();
                router.refresh();
            } catch (error) {
                toast.error("Could not mark as complete");
            }
        }
    }, [courseId, chapterId, unitId, isCompleted, onComplete, router, getStorageKey, syncProgressToDb]);

    // ആപ്പ് ബാക്ക്ഗ്രൗണ്ടിലേക്ക് മാറുമ്പോഴോ ടാബ് അടയ്ക്കുമ്പോഴോ ഉടൻ തന്നെ സിങ്ക് ചെയ്യുക (resilient sync)
    useEffect(() => {
        const handleSync = () => {
            syncProgressToDb(currentProgressSecondsRef.current);
        };
        
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                handleSync();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("pagehide", handleSync);
        window.addEventListener("beforeunload", handleSync);
        
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pagehide", handleSync);
            window.removeEventListener("beforeunload", handleSync);
            // Component unmount ചെയ്യുമ്പോൾ അവസാന പ്രോഗ്രസ്സ് സിങ്ക് ചെയ്യുക
            handleSync();
        };
    }, [syncProgressToDb]);
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleMarkAsComplete = () => {
        if (!courseId || !chapterId) return;

        startTransition(async () => {
            try {
                // local storage ക്ലിയർ ചെയ്യുക
                if (typeof window !== "undefined") {
                    localStorage.removeItem(getStorageKey());
                }
                // unitId ഉള്ളപ്പോൾ unit-level progress update ചെയ്യുക
                await updateChapterProgress(courseId, chapterId, { isCompleted: !isCompleted, unitId });
                if (!isCompleted) {
                    toast.success("Lesson marked as complete");
                }
                if (onComplete) onComplete();
                router.refresh();
            } catch (error) {
                toast.error("Something went wrong");
            }
        });
    };

    // video-utils ഉപയ്യോഗിച്ച് video type detect ചെയ്യുക — YouTube short links, shorts, embed ഒക്കെ handle ചെയ്യും
    const videoType = getVideoType(cleanUrl);
    const isBunnyVideo = videoType === "bunny";
    const bunnyVideoId = isBunnyVideo ? cleanUrl?.replace("bunny://", "").split(/[?#]/)[0] : null;
    const youtubeId = videoType === "youtube" && cleanUrl ? extractYouTubeId(cleanUrl) : null;
    const vimeoId = videoType === "vimeo" && cleanUrl ? cleanUrl.match(/vimeo\.com\/(?:.*\/)?(\d+)/)?.[1] : null;
    const isExternalEmbed = videoType === "youtube" || videoType === "vimeo";

    return (
        <div className="flex-1 bg-white dark:bg-slate-900">
            {/* Lesson Header - കമ്പ്യൂട്ടർ സ്ക്രീനിൽ കുറച്ചുകൂടി ഒതുങ്ങിയ അളവിൽ കുറഞ്ഞ ഉയരത്തിൽ പ്ലേബാക്ക് ബട്ടണുകളോടെ റീഡിസൈൻ ചെയ്യുന്നു */}
            <div className="py-2 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div className="flex-1 min-w-0 mr-4">
                    <div className="text-[10px] md:text-xs font-semibold text-orange-600 dark:text-orange-400 mb-0.5">
                        Lesson {lessonNumber}
                    </div>
                    <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">
                        {title}
                    </h1>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Desktop Navigation Buttons - കമ്പ്യൂട്ടർ സ്ക്രീനിൽ മാത്രം കാണുന്ന വളരെ മിനിമൽ ആയ Prev / Next ബട്ടണുകൾ */}
                    <div className="hidden lg:flex items-center gap-1.5 mr-2">
                        <Button
                            variant="outline"
                            onClick={onPrevious}
                            disabled={!hasPrevious}
                            className="h-8 px-2.5 flex items-center gap-1 text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span>Prev</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onNext}
                            disabled={!hasNext}
                            className="h-8 px-2.5 flex items-center gap-1 text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        >
                            <span>Next</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Completion status button */}
                    {courseId && chapterId && (
                        <Button
                            onClick={handleMarkAsComplete}
                            disabled={isLoading}
                            variant={isCompleted ? "outline" : "default"}
                            className={isCompleted 
                                ? "h-8 text-xs px-3 text-green-600 hover:text-green-700 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/30" 
                                : "h-8 text-xs px-3 bg-orange-600 hover:bg-orange-700 text-white"
                            }
                        >
                            {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isCompleted ? (
                                <>
                                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                    Completed
                                </>
                            ) : (
                                "Mark as Complete"
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Video Player - 14 ഇഞ്ച് ലാപ്ടോപ്പ് മുതൽ വലിയ മോണിറ്ററുകളിൽ വരെ സ്ക്രീൻ ഉയരത്തിന് അനുസരിച്ച് (calc(100vh - 110px)) പരമാവധി വലിപ്പത്തിൽ കാണിക്കുന്നു */}
            <div className="w-full bg-slate-50 dark:bg-slate-950/40 flex-none py-0 lg:py-2 border-b border-slate-200 dark:border-slate-800/60">
                <div 
                    ref={videoContainerRef}
                    className="relative aspect-video bg-slate-950 w-full mx-auto overflow-hidden lg:rounded-2xl lg:shadow-2xl border border-transparent lg:border-slate-200/80 dark:lg:border-slate-800/80"
                    style={{
                        maxHeight: isDesktop ? "calc(100vh - 110px)" : undefined,
                        maxWidth: isDesktop ? "calc((100vh - 110px) * 1.77)" : undefined,
                    }}
                >
                    {cleanUrl && isTimeLoaded ? (
                        <>
                            {isBunnyVideo && bunnyVideoId ? (
                                // Bunny.net Video
                                <div className="w-full h-full">
                                    <BunnyVideoPlayer
                                        videoId={bunnyVideoId}
                                        className="w-full h-full border-none rounded-none"
                                        courseId={courseId}
                                        title={title}
                                        initialTime={initialTime}
                                        onProgress={handleProgress}
                                        disableFullscreenHook={true}
                                        onEnd={handleEnd}
                                    />
                                </div>
                            ) : videoType === "youtube" && youtubeId ? (
                                // YouTube Video
                                <div className="w-full h-full">
                                    <YoutubeVideoPlayer
                                        videoId={youtubeId}
                                        className="w-full h-full border-none rounded-none"
                                        initialTime={initialTime}
                                        onProgress={handleProgress}
                                        onPause={handlePause}
                                        onEnd={handleEnd}
                                        title={title}
                                    />
                                </div>
                            ) : videoType === "vimeo" && vimeoId ? (
                                // Vimeo Video
                                <div className="w-full h-full">
                                    <VimeoVideoPlayer
                                        videoId={vimeoId}
                                        className="w-full h-full border-none rounded-none"
                                        initialTime={initialTime}
                                        onProgress={handleProgress}
                                        onPause={handlePause}
                                        onEnd={handleEnd}
                                        title={title}
                                    />
                                </div>
                            ) : (
                                // Native MP4 Video or Direct URL Video
                                <div className="w-full h-full">
                                    <NativeVideoPlayer
                                        src={cleanUrl}
                                        className="w-full h-full border-none rounded-none"
                                        initialTime={initialTime}
                                        onProgress={handleProgress}
                                        onPause={handlePause}
                                        onEnd={handleEnd}
                                    />
                                </div>
                            )}
                        </>
                    ) : cleanUrl ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No video available for this lesson</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lesson Description & Attachments */}
            <div className="p-6 space-y-6">
                {description && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                            About this lesson
                        </h2>
                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                )}

                {attachments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                            Attachments
                        </h2>
                        <div className="space-y-2">
                            {attachments.map((attachment) => {
                                const isFile = attachment.url.includes('uploadthing.com') || attachment.url.includes('supabase.co');

                                return (
                                    <a
                                        href={attachment.url}
                                        target="_blank"
                                        key={attachment.id}
                                        rel="noreferrer"
                                        className="flex items-center p-3 w-full bg-slate-100 dark:bg-slate-800 border text-slate-700 dark:text-slate-300 rounded-md hover:underline"
                                    >
                                        {isFile ? (
                                            <File className="h-4 w-4 mr-2 flex-shrink-0 text-orange-500" />
                                        ) : (
                                            <Link2 className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                                        )}
                                        <div className="flex flex-col flex-1 overflow-hidden mr-2">
                                            <p className="font-medium line-clamp-1">{attachment.name}</p>
                                            {!isFile && (
                                                <span className="text-[10px] text-slate-500 no-underline line-clamp-1 truncate">
                                                    {attachment.url}
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
