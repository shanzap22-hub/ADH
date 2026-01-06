"use client";

import * as z from "zod";
import { Pencil, Video, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { VideoUpload } from "@/components/bunny/VideoUpload";
import { BunnyVideoPlayer } from "@/components/bunny/BunnyVideoPlayer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChapterVideoFormProps {
    initialData: {
        video_url: string | null;
    };
    courseId: string;
    chapterId: string;
    onChange: (video_url: string | null) => void;
}

const formSchema = z.object({
    video_url: z.string().min(1),
});

export const ChapterVideoForm = ({
    initialData,
    courseId,
    chapterId,
    onChange
}: ChapterVideoFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const toggleEdit = () => setIsEditing((current) => !current);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            console.log("[CHAPTER_VIDEO] Saving video URL:", values.video_url);

            const { error, data } = await supabase
                .from("chapters")
                .update(values)
                .eq("id", chapterId)
                .select();

            if (error) {
                console.error("[CHAPTER_VIDEO] Database error:", error);
                toast.error("Failed to save video", { description: error.message });
                return;
            }

            console.log("[CHAPTER_VIDEO] Video saved successfully:", data);
            toast.success("Video saved successfully!");
            toggleEdit();
            router.refresh();
        } catch (error: any) {
            console.error("[CHAPTER_VIDEO] Save error:", error);
            toast.error("Something went wrong", { description: error.message });
        }
    };

    const handleBunnyUploadComplete = async (videoId: string) => {
        console.log("[CHAPTER_VIDEO] Bunny upload complete, videoId:", videoId);
        // Emit change to parent with bunny:// prefix
        onChange(`bunny://${videoId}`);
        toggleEdit();
    };

    // Detect video type
    const isBunnyVideo = initialData.video_url?.startsWith('bunny://');
    const bunnyVideoId = isBunnyVideo ? initialData.video_url?.replace('bunny://', '') : null;
    const isYouTube = initialData.video_url?.includes('youtube.com') || initialData.video_url?.includes('youtu.be');
    const isVimeo = initialData.video_url?.includes('vimeo.com');
    const isExternalEmbed = isYouTube || isVimeo;

    const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com/watch')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('vimeo.com')) {
            const vimeoId = url.split('/').pop();
            return `https://player.vimeo.com/video/${vimeoId}`;
        }
        return url;
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-slate-900">
            <div className="font-medium flex items-center justify-between">
                Chapter video
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing && (
                        <>Cancel</>
                    )}
                    {!isEditing && !initialData.video_url && (
                        <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add a video
                        </>
                    )}
                    {!isEditing && initialData.video_url && (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit video
                        </>
                    )}
                </Button>
            </div>

            {/* Video Preview */}
            {!isEditing && (
                <>
                    {!initialData.video_url ? (
                        <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md dark:bg-slate-800 mt-2">
                            <Video className="h-10 w-10 text-slate-500" />
                        </div>
                    ) : (
                        <div className="relative mt-2">
                            {isBunnyVideo && bunnyVideoId ? (
                                // Bunny.net Video
                                <BunnyVideoPlayer videoId={bunnyVideoId} title="Chapter Video" />
                            ) : isExternalEmbed ? (
                                // YouTube/Vimeo Preview
                                <div className="aspect-video rounded-md overflow-hidden bg-slate-900">
                                    <iframe
                                        src={getEmbedUrl(initialData.video_url)}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        title="Video preview"
                                    />
                                </div>
                            ) : (
                                // HTML5 Video Preview
                                <div className="aspect-video rounded-md overflow-hidden bg-slate-900">
                                    <video
                                        src={initialData.video_url}
                                        controls
                                        preload="metadata"
                                        className="w-full h-full object-contain bg-black"
                                        controlsList="nodownload"
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Upload/Edit Form */}
            {isEditing && (
                <div className="mt-4">
                    <Tabs defaultValue="bunny" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="bunny">Bunny.net Upload</TabsTrigger>
                            <TabsTrigger value="other">Other Sources</TabsTrigger>
                        </TabsList>

                        <TabsContent value="bunny" className="mt-4">
                            <VideoUpload
                                onUploadComplete={handleBunnyUploadComplete}
                                onUploadStart={() => toast.info("Starting upload...")}
                            />
                            <div className="text-xs text-muted-foreground mt-4">
                                Upload your video directly to Bunny.net for optimized streaming and playback.
                            </div>
                        </TabsContent>

                        <TabsContent value="other" className="mt-4">
                            <FileUpload
                                endpoint="chapter-videos"
                                onChange={(url) => {
                                    if (url) {
                                        // Emit change to parent instead of saving
                                        onChange(url);
                                        toggleEdit();
                                    }
                                }}
                            />
                            <div className="text-xs text-muted-foreground mt-4">
                                Upload a video file (MP4/MOV) or paste a YouTube/Vimeo link
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Status Message */}
            {initialData.video_url && !isEditing && (
                <div className="text-xs text-sky-600 font-medium mt-2">
                    ✓ Video uploaded and ready
                    {isBunnyVideo && <span className="ml-2 text-orange-600">• Bunny.net (Optimized)</span>}
                </div>
            )}
        </div>
    )
}
