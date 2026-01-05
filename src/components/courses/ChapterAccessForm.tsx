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
    FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ChapterAccessFormProps {
    initialData: {
        is_free: boolean;
    };
    courseId: string;
    chapterId: string;
}

const formSchema = z.object({
    is_free: z.boolean().default(false),
});

export const ChapterAccessForm = ({
    initialData,
    courseId,
    chapterId
}: ChapterAccessFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const toggleEdit = () => setIsEditing((current) => !current);

    const form = useForm<z.infer<typeof formSchema>>({
        // @ts-ignore
        resolver: zodResolver(formSchema),
        defaultValues: {
            is_free: !!initialData.is_free
        },
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: any) => {
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
                Chapter access
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit access
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <p className="text-sm mt-2 text-slate-500 italic">
                    {initialData.is_free ? (
                        <>This chapter is free for preview.</>
                    ) : (
                        <>This chapter is not free.</>
                    )}
                </p>
            )}
            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control as any}
                            name="is_free"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormDescription>
                                            Check this box if you want to make this chapter free for preview
                                        </FormDescription>
                                    </div>
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
