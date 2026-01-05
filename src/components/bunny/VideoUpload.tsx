"use client";

import { useState, useRef } from "react";
import * as tus from "tus-js-client";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface VideoUploadProps {
    onUploadComplete: (videoId: string) => void;
    onUploadStart?: () => void;
}

export const VideoUpload = ({ onUploadComplete, onUploadStart }: VideoUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
    const [videoId, setVideoId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadRef = useRef<tus.Upload | null>(null);

    const handleFileSelect = (selectedFile: File) => {
        // Validate file type
        const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error("Please upload a valid video file (MP4, MOV, AVI, WEBM)");
            return;
        }

        // Validate file size (max 2GB)
        const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
        if (selectedFile.size > maxSize) {
            toast.error("File size must be less than 2GB");
            return;
        }

        setFile(selectedFile);
        setUploadStatus("idle");
        setUploadProgress(0);
    };

    const startUpload = async () => {
        if (!file) return;

        try {
            setUploading(true);
            setUploadStatus("uploading");
            setUploadProgress(0);
            onUploadStart?.();

            // Get upload URL from Bunny.net via our API
            const response = await fetch("/api/bunny/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileName: file.name,
                    fileSize: file.size,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to get upload URL from Bunny.net");
            }

            const { uploadUrl, videoId: bunnyVideoId } = await response.json();

            // Upload using TUS protocol
            const upload = new tus.Upload(file, {
                endpoint: uploadUrl,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                metadata: {
                    filename: file.name,
                    filetype: file.type,
                },
                onError: (error) => {
                    console.error("[BUNNY_UPLOAD] Upload failed:", error);
                    setUploadStatus("error");
                    setUploading(false);
                    toast.error("Upload failed. Please try again.");
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                    setUploadProgress(percentage);
                },
                onSuccess: () => {
                    console.log("[BUNNY_UPLOAD] Upload complete:", bunnyVideoId);
                    setVideoId(bunnyVideoId);
                    setUploadStatus("processing");
                    setUploading(false);

                    // Wait for video processing
                    checkVideoStatus(bunnyVideoId);
                },
            });

            uploadRef.current = upload;
            upload.start();

        } catch (error: any) {
            console.error("[BUNNY_UPLOAD] Error:", error);
            setUploadStatus("error");
            setUploading(false);
            toast.error(error.message || "Failed to start upload");
        }
    };

    const checkVideoStatus = async (bunnyVideoId: string) => {
        try {
            const response = await fetch(`/api/bunny/video-status?videoId=${bunnyVideoId}`);

            if (!response.ok) {
                throw new Error("Failed to check video status");
            }

            const data = await response.json();

            if (data.status === "ready") {
                setUploadStatus("success");
                toast.success("Video uploaded and processed successfully!");
                onUploadComplete(bunnyVideoId);
            } else if (data.status === "processing") {
                // Check again in 3 seconds
                setTimeout(() => checkVideoStatus(bunnyVideoId), 3000);
            } else if (data.status === "failed") {
                setUploadStatus("error");
                toast.error("Video processing failed");
            }
        } catch (error) {
            console.error("[BUNNY_UPLOAD] Status check error:", error);
            setUploadStatus("error");
            toast.error("Failed to verify video status");
        }
    };

    const cancelUpload = () => {
        if (uploadRef.current) {
            uploadRef.current.abort();
        }
        setFile(null);
        setUploading(false);
        setUploadStatus("idle");
        setUploadProgress(0);
    };

    const reset = () => {
        setFile(null);
        setUploadStatus("idle");
        setUploadProgress(0);
        setVideoId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-4">
            {/* File Input / Drag & Drop */}
            {!file && uploadStatus !== "success" && (
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center hover:border-orange-400 dark:hover:border-orange-500 transition">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) handleFileSelect(selectedFile);
                        }}
                    />

                    <div
                        className="cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) handleFileSelect(droppedFile);
                        }}
                    >
                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            MP4, MOV, AVI, WEBM (max 2GB)
                        </p>
                    </div>
                </div>
            )}

            {/* Selected File */}
            {file && uploadStatus === "idle" && (
                <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFile(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={startUpload}
                        className="w-full mt-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                    >
                        Upload Video to Bunny.net
                    </Button>
                </div>
            )}

            {/* Upload Progress */}
            {uploadStatus === "uploading" && (
                <div className="border border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                            <span className="text-sm font-medium">Uploading...</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelUpload}
                        >
                            Cancel
                        </Button>
                    </div>

                    <Progress value={uploadProgress} className="h-2" />

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {uploadProgress}% complete
                    </p>
                </div>
            )}

            {/* Processing */}
            {uploadStatus === "processing" && (
                <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium">Processing video...</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        Bunny.net is optimizing your video for playback. This may take a few moments.
                    </p>
                </div>
            )}

            {/* Success */}
            {uploadStatus === "success" && videoId && (
                <div className="border border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                            Video uploaded successfully!
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Video ID: {videoId}
                    </p>
                    <Button
                        onClick={reset}
                        variant="outline"
                        size="sm"
                    >
                        Upload Another Video
                    </Button>
                </div>
            )}

            {/* Error */}
            {uploadStatus === "error" && (
                <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            Upload failed
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Something went wrong. Please try again.
                    </p>
                    <Button
                        onClick={reset}
                        variant="outline"
                        size="sm"
                    >
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
};
