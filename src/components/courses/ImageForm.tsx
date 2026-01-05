"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, ImageIcon, PlusCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";

interface ImageFormProps {
    initialData: {
        image_url: string | null;
    };
    courseId: string;
}

const formSchema = z.object({
    image_url: z.string().min(1, {
        message: "Image is required",
    }),
});

export const ImageForm = ({
    initialData,
    courseId
}: ImageFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const toggleEdit = () => setIsEditing((current) => !current);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const { error } = await supabase
                .from("courses")
                .update(values)
                .eq("id", courseId);

            if (error) {
                toast.error("Something went wrong", { description: error.message });
            } else {
                toast.success("Course updated");
                toggleEdit();
                router.refresh();
            }
        } catch {
            toast.error("Something went wrong");
        }
    }

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-slate-900">
            <div className="font-medium flex items-center justify-between">
                Course image
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing && (
                        <>Cancel</>
                    )}
                    {!isEditing && !initialData.image_url && (
                        <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add an image
                        </>
                    )}
                    {!isEditing && initialData.image_url && (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit image
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                !initialData.image_url ? (
                    <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md dark:bg-slate-800">
                        <ImageIcon className="h-10 w-10 text-slate-500" />
                    </div>
                ) : (
                    <div className="relative aspect-video mt-2">
                        <Image
                            alt="Upload"
                            fill
                            className="object-cover rounded-md"
                            src={initialData.image_url}
                        />
                    </div>
                )
            )}
            {isEditing && (
                <div>
                    <FileUpload
                        endpoint="course-thumbnails"
                        onChange={(url) => {
                            if (url) {
                                onSubmit({ image_url: url });
                            }
                        }}
                    />
                    <div className="text-xs text-muted-foreground mt-4">
                        16:9 aspect ratio recommended
                    </div>
                </div>
            )}
        </div>
    )
}
