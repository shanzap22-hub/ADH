"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea"; // Ensure Textarea handles ...props correctly

interface ChapterDescriptionFormProps {
    initialData: {
        description: string | null;
    };
    courseId: string;
    chapterId: string;
}

const formSchema = z.object({
    description: z.string().min(1),
});

export const ChapterDescriptionForm = ({
    initialData,
    courseId,
    chapterId
}: ChapterDescriptionFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const toggleEdit = () => setIsEditing((current) => !current);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: initialData.description || ""
        },
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            const { error } = await supabase
                .from("chapters")
                .update(values)
                .eq("id", chapterId);

            if (error) {
                toast.error("Something went wrong", { description: error.message });
            } else {
                toast.success("Chapter updated");
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
                Chapter description
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit description
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <p className={cn(
                    "text-sm mt-2",
                    !initialData.description && "text-slate-500 italic"
                )}>
                    {initialData.description || "No description"}
                </p>
            )}
            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Textarea
                                            disabled={isSubmitting}
                                            placeholder="e.g. 'This chapter explains...'"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-x-2">
                            <Button
                                disabled={!isValid || isSubmitting}
                                type="submit"
                            >
                                Save
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    )
}
