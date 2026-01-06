"use client";

import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { createBunnyVideoWithSignature, getBunnyVideoStatus } from "@/actions/bunny";

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
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleFileSelect = (selectedFile: File) => {
        const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error("Please upload a valid video file (MP4, MOV, AVI, WEBM)");
            return;
        }

        const maxSize = 2 * 1024 * 1024 * 1024;
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

            console.log("[UPLOAD] Getting signature from server...");

            // Step 1: Get signature from server action (NO FILE SENT)
            const signature = await createBunnyVideoWithSignature(file.name);
            setVideoId(signature.videoId);

            console.log("[UPLOAD] Got signature, uploading DIRECTLY to Bunny.net:", signature.videoId);
            console.log("[UPLOAD] Upload URL:", signature.uploadUrl);

            // Step 2: Upload DIRECTLY to Bunny.net using fetch with progress
            const abortController = new AbortController();
            abortControllerRef.current = abortController;

            // Use XMLHttpRequest for progress tracking
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
                if (event.lengthComputable) {
                    const percentage = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percentage);
                    console.log(`[UPLOAD] Progress: ${percentage}%`);
                }
            });

            xhr.addEventListener("load", () => {
                console.log("[UPLOAD] XHR Load event, status:", xhr.status);

                if (xhr.status === 200 || xhr.status === 201) {
                    console.log("[UPLOAD] Upload successful!");
                    setUploadStatus("processing");
                    setUploadProgress(100);
                    setUploading(false);
                    checkVideoStatus(signature.videoId);
                } else {
                    console.error("[UPLOAD] Failed:", xhr.status, xhr.statusText, xhr.responseText);
                    setUploadStatus("error");
                    setUploading(false);
                    toast.error(`Upload failed: ${xhr.statusText || "Unknown error"}`);
                }
            });

            xhr.addEventListener("error", (event) => {
                console.error("[UPLOAD] XHR Error:", event);
                setUploadStatus("error");
                setUploading(false);
                toast.error("Network error. Please check your connection.");
            });

            xhr.addEventListener("abort", () => {
                console.log("[UPLOAD] Upload cancelled");
                setUploadStatus("idle");
                setUploading(false);
            });

            // Open PUT request to Bunny.net (DIRECT - no Next.js API)
            xhr.open("PUT", signature.uploadUrl, true);

            // Set Bunny.net authentication headers
            xhr.setRequestHeader("AuthorizationSignature", signature.authorizationSignature);
            xhr.setRequestHeader("AuthorizationExpire", signature.authorizationExpire.toString());
            xhr.setRequestHeader("VideoId", signature.videoId);
            xhr.setRequestHeader("LibraryId", signature.libraryId);

            console.log("[UPLOAD] Sending file to Bunny.net...");

            // Send the file DIRECTLY to Bunny.net
            xhr.send(file);

        } catch (error: any) {
            console.error("[UPLOAD] Error in startUpload:", error);
            setUploadStatus("error");
            setUploading(false);
            toast.error(error.message || "Failed to start upload");
        }
    };

    const checkVideoStatus = async (bunnyVideoId: string) => {
        try {
            console.log("[UPLOAD] Checking video status...");
            const status = await getBunnyVideoStatus(bunnyVideoId);

            console.log("[UPLOAD] Status:", status.status);

            if (status.status === "ready") {
                setUploadStatus("success");
                toast.success("Video uploaded and processed successfully!");
                onUploadComplete(bunnyVideoId);
            } else if (status.status === "processing") {
                setTimeout(() => checkVideoStatus(bunnyVideoId), 3000);
            } else {
                setUploadStatus("error");
                toast.error("Video processing failed");
            }
        } catch (error) {
            console.error("[UPLOAD] Status check error:", error);
            // Keep retrying for a while
            setTimeout(() => checkVideoStatus(bunnyVideoId), 5000);
        }
    };

    const cancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
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
                        <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
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

            {uploadStatus === "uploading" && (
                <div className="border border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                            <span className="text-sm font-medium">Uploading to Bunny.net...</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={cancelUpload}>
                            Cancel
                        </Button>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        {uploadProgress}% complete • Direct browser → Bunny.net
                    </p>
                </div>
            )}

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
                    <Button onClick={reset} variant="outline" size="sm">
                        Upload Another Video
                    </Button>
                </div>
            )}

            {uploadStatus === "error" && (
                <div className="border border-red-300 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            Upload failed
                        </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Check the browser console for details. Ensure your Bunny.net API key and library ID are correct.
                    </p>
                    <Button onClick={reset} variant="outline" size="sm">
                        Try Again
                    </Button>
                </div>
            )}
        </div>
    );
};
