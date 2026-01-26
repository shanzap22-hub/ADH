"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { UploadCloud, X, File } from "lucide-react";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";

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
    const supabase = createClient();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles?.[0];
        if (!file) return;

        // File size limits
        const isVideo = endpoint === "chapter-videos";
        const isAttachment = endpoint === "course-attachments";

        // Limits: 4GB for Video, 500MB for Attachment, 10MB for Image
        const limitAPI = isVideo ? 4 * 1024 * 1024 * 1024 : isAttachment ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
        const limitLabel = isVideo ? "4GB" : isAttachment ? "500MB" : "10MB";

        if (file.size > limitAPI) {
            toast.error(`File is too large. Maximum size is ${limitLabel}.`);
            return;
        }

        try {
            setIsUploading(true);

            // Check if we should use Bunny Storage
            if (endpoint === "course-thumbnails" || endpoint === "course-attachments" || endpoint === "blog-images") {

                // For Attachments: Use Direct Client-Side Upload (to support large files > 4.5MB and bypass Vercel limits)
                if (endpoint === "course-attachments") {
                    try {
                        const { getBunnyCredentials } = await import("@/actions/bunny");
                        const creds = await getBunnyCredentials();

                        const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                        const uniqueFileName = `${Date.now()}-${fileName}`;

                        // Determine Hostname
                        let regionCode = creds.region.toLowerCase().trim();
                        if (regionCode === "singapore" || regionCode === "asia") regionCode = "sg";
                        if (regionCode === "stockholm" || regionCode === "europe") regionCode = "se";
                        if (regionCode === "germany") regionCode = "de";

                        const hostname = regionCode === 'de' ? 'storage.bunnycdn.com' : `${regionCode}.storage.bunnycdn.com`;

                        const uploadPath = `${endpoint}/${uniqueFileName}`;
                        const uploadUrl = `https://${hostname}/${creds.zoneName}/${uploadPath}`;

                        // Direct PUT
                        const response = await fetch(uploadUrl, {
                            method: 'PUT',
                            headers: {
                                'AccessKey': creds.apiKey,
                                'Content-Type': file.type || 'application/octet-stream'
                            },
                            body: file
                        });

                        if (!response.ok) {
                            throw new Error(`Bunny Upload Failed: ${response.statusText}`);
                        }

                        // Construct Public URL
                        const finalUrl = `https://${creds.pullZone}/${uploadPath}`;

                        onChange(finalUrl);
                        toast.success("File uploaded to Bunny");
                        setIsUploading(false);
                        return;

                    } catch (e: any) {
                        console.error(e);
                        toast.error("Upload failed: " + (e.message || "Unknown error"));
                        setIsUploading(false);
                        return;
                    }
                }

                // For Images (Thumbnails/Blog): Continue using Server Action (small files)
                const formData = new FormData();
                formData.append("file", file);

                const { uploadToBunny } = await import("@/actions/bunny");
                const result = await uploadToBunny(formData, endpoint);

                if (result.error) throw new Error(result.error);

                onChange(result.url);
                toast.success("File uploaded to Bunny");
                setIsUploading(false);
                return;
            }

            // Fallback to Supabase for other endpoints (e.g. chapter-videos)
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const { error: uploadError } = await supabase.storage
                .from(endpoint)
                .upload(fileName, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(endpoint)
                .getPublicUrl(fileName);

            onChange(publicUrl);
            toast.success("File uploaded");
        } catch (error: any) {
            if (error.message) {
                toast.error(error.message);
            } else {
                toast.error("Something went wrong");
            }
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    }, [endpoint, onChange, supabase.storage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        disabled: disabled || isUploading,
        accept: (endpoint === "course-thumbnails" || endpoint === "blog-images")
            ? { 'image/*': [] }
            : endpoint === "chapter-videos"
                ? { 'video/*': [] }
                : undefined // Accept all files for attachments
    });

    if (value && (endpoint === "course-thumbnails" || endpoint === "blog-images")) {
        return (
            <div className="relative aspect-video w-full h-full">
                <Image
                    fill
                    src={value}
                    alt="Upload"
                    className="object-cover rounded-md"
                />
                <button
                    onClick={() => onChange("")}
                    className="bg-rose-500 text-white p-1 rounded-full absolute top-1 right-1 shadow-sm"
                    type="button"
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }

    if (value && endpoint === "chapter-videos") {
        return (
            <div className="relative aspect-video mt-2">
                Video uploaded:
                <a href={value} target="_blank" className="text-sky-500 underline ml-2 text-sm break-all">
                    {value}
                </a>
                <button
                    onClick={() => onChange("")}
                    className="bg-rose-500 text-white p-1 rounded-full absolute -top-2 -right-2 shadow-sm"
                    type="button"
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        )
    }

    return (
        <div {...getRootProps()} className="border-2 border-dashed border-slate-300 rounded-md p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 transition bg-slate-50">
            <input {...getInputProps()} />
            <UploadCloud className="h-10 w-10 text-slate-500 mb-2" />
            <p className="text-sm text-slate-500">
                {isUploading ? "Uploading..." : "Drag & drop or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
                {endpoint === "course-attachments"
                    ? "Any file (max 500MB)"
                    : (endpoint === "course-thumbnails" || endpoint === "blog-images")
                        ? "Images only (max 10MB)"
                        : "Videos only (max 4GB)"}
            </p>
        </div>
    )
}
