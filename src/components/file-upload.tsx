"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { UploadCloud, X, File, Loader2, Video, FileText } from "lucide-react";
import Image from "next/image";

interface FileUploadProps {
    endpoint: "course-thumbnails" | "chapter-videos" | "course-attachments" | "blog-images";
    onChange: (url?: string) => void;
    value?: string;
    disabled?: boolean;
}

export const FileUpload = ({
    endpoint,
    onChange,
    value,
    disabled
}: FileUploadProps) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles?.[0];
        if (!file) return;

        const isVideo = endpoint === "chapter-videos";
        const isAttachment = endpoint === "course-attachments";
        const isImage = endpoint === "course-thumbnails" || endpoint === "blog-images";

        // Limits: 4GB for Video, 500MB for Attachment, 10MB for Image
        const limitAPI = isVideo ? 4 * 1024 * 1024 * 1024 : isAttachment ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
        const limitLabel = isVideo ? "4GB" : isAttachment ? "500MB" : "10MB";

        if (file.size > limitAPI) {
            toast.error(`File is too large. Maximum size is ${limitLabel}.`);
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // CASE 1: VIDEOS -> Bunny Stream
            if (isVideo) {
                const { getBunnySignature } = await import("@/actions/bunny");
                const { videoId, libraryId, authorizationSignature, authorizationExpire } = await getBunnySignature(file.name, file.type);

                // Manual XHR for progress tracking
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, true);
                xhr.setRequestHeader('AuthorizationSignature', authorizationSignature);
                xhr.setRequestHeader('AuthorizationExpire', authorizationExpire);
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        onChange(videoId); // Store the Video ID
                        toast.success("Video uploaded to Bunny Stream. Encoding started.");
                        setIsUploading(false);
                    } else {
                        toast.error("Bunny Stream upload failed");
                        setIsUploading(false);
                    }
                };

                xhr.onerror = () => {
                    toast.error("Upload error");
                    setIsUploading(false);
                };

                xhr.send(file);
                return;
            }

            // CASE 2: ATTACHMENTS -> Cloudflare R2 (Large files via Presigned URL)
            if (isAttachment) {
                const { getPresignedUrl } = await import("@/actions/r2");
                const { signedUrl, publicUrl, error } = await getPresignedUrl(file.name, file.type, endpoint);

                if (error || !signedUrl) throw new Error(error || "Failed to get upload URL");

                const xhr = new XMLHttpRequest();
                xhr.open('PUT', signedUrl, true);
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        onChange(publicUrl);
                        toast.success("Attachment uploaded to R2");
                        setIsUploading(false);
                    } else {
                        toast.error("R2 upload failed");
                        setIsUploading(false);
                    }
                };

                xhr.send(file);
                return;
            }

            // CASE 3: IMAGES -> Cloudflare R2 (Smaller files via Server Action)
            if (isImage) {
                const formData = new FormData();
                formData.append("file", file);

                const { uploadToR2 } = await import("@/actions/r2");
                const result = await uploadToR2(formData, endpoint);

                if (result.error) throw new Error(result.error);

                onChange(result.url);
                toast.success("Image uploaded to R2");
                setIsUploading(false);
                return;
            }

        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
            console.error(error);
        } finally {
            if (!isVideo && !isAttachment) setIsUploading(false);
        }
    }, [endpoint, onChange]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxFiles: 1,
        disabled: disabled || isUploading,
        accept: (endpoint === "course-thumbnails" || endpoint === "blog-images")
            ? { 'image/*': [] }
            : endpoint === "chapter-videos"
                ? { 'video/*': [] }
                : undefined 
    });

    // DISPLAY: Image Preview
    if (value && (endpoint === "course-thumbnails" || endpoint === "blog-images")) {
        return (
            <div className="relative aspect-video w-full">
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className="object-cover rounded-xl border border-slate-200"
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-rose-500 text-white p-1.5 rounded-full absolute -top-2 -right-2 shadow-lg hover:scale-110 transition"
                    type="button"
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }

    // DISPLAY: Video / Attachment Indicator
    if (value) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    {endpoint === "chapter-videos" ? <Video className="h-5 w-5 text-emerald-600" /> : <FileText className="h-5 w-5 text-emerald-600" />}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-black text-emerald-800 uppercase tracking-widest truncate">
                        {endpoint === "chapter-videos" ? "Video ID" : "File Uploaded"}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 truncate opacity-70">{value}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:text-rose-500"
                    onClick={() => onChange("")}
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    return (
        <div {...getRootProps()} className={`
            border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
            ${isUploading ? "bg-slate-50 border-violet-300" : "bg-white border-slate-200 hover:border-violet-400 hover:bg-violet-50/30"}
        `}>
            <input {...getInputProps()} />
            
            {isUploading ? (
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative w-16 h-16">
                        <Loader2 className="h-16 w-16 text-violet-600 animate-spin opacity-20" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-violet-600">{uploadProgress}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Uploading Resource</p>
                        <p className="text-[10px] text-slate-400 font-bold">Please don't close the browser</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden border">
                        <div 
                            className="h-full bg-violet-600 transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                        <UploadCloud className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-black text-slate-700 uppercase tracking-widest">Select {endpoint.replace("-", " ")}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">
                            {endpoint === "course-attachments"
                                ? "Any file (max 500MB)"
                                : (endpoint === "course-thumbnails" || endpoint === "blog-images")
                                    ? "Images only (max 10MB)"
                                    : "Videos only (max 4GB)"}
                        </p>
                    </div>
                </>
            )}
        </div>
    )
}
