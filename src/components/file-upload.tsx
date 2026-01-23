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

        try {
            setIsUploading(true);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Check if we should use Bunny Storage
            if (endpoint === "course-thumbnails" || endpoint === "course-attachments" || endpoint === "blog-images") {
                const formData = new FormData();
                formData.append("file", file);

                // We use dynamic import or updated logic for server action call in client
                // Note: FileUpload is client component, so we can call server action
                const { uploadToBunny } = await import("@/actions/bunny-actions");
                const result = await uploadToBunny(formData, endpoint);

                if (result.error) throw new Error(result.error);

                onChange(result.url);
                toast.success("File uploaded to Bunny");
                setIsUploading(false);
                return;
            }

            // Fallback to Supabase for other endpoints (e.g. chapter-videos)
            const { error: uploadError } = await supabase.storage
                .from(endpoint)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(endpoint)
                .getPublicUrl(filePath);

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
                {(endpoint === "course-thumbnails" || endpoint === "blog-images") ? "Images only" : "Videos only"}
            </p>
        </div>
    )
}
