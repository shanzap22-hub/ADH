"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, { message: "Title is required" }),
    banner_url: z.string().min(1, { message: "Banner image is required" }),
    features_text: z.string(), // We will split this into JSON array
});

export const OneOnOneManager = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "1-on-1 Strategy Call",
            banner_url: "",
            features_text: "",
        },
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/instructor/one-on-one-settings");
                const data = await res.json();

                if (data && data.banner_url) {
                    const features = data.features || [];
                    const text = Array.isArray(features) ? features.join('\n') : "";

                    form.reset({
                        id: data.id,
                        title: data.title || "1-on-1 Strategy Call",
                        banner_url: data.banner_url || "",
                        features_text: text,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            // Convert text to array
            const featuresArray = values.features_text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            const payload = {
                title: values.title,
                banner_url: values.banner_url,
                features: featuresArray
            };

            const response = await fetch("/api/instructor/one-on-one-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("1-on-1 Settings updated successfully!");
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm mt-8">
            <h2 className="text-xl font-bold mb-6">Manage 1-on-1 Strategy Call Content</h2>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Banner Image */}
                    <FormField
                        control={form.control}
                        name="banner_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Banner Image</FormLabel>
                                <FormControl>
                                    <FileUpload
                                        endpoint="course-thumbnails"
                                        onChange={(url) => {
                                            if (url) field.onChange(url);
                                        }}
                                        value={field.value}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Title */}
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 1-on-1 Strategy Call" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Features List */}
                    <FormField
                        control={form.control}
                        name="features_text"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bullet Points (One per line)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Meta & Social Media Strategy&#10;Automation & AI Setup&#10;Personal Branding Blueprint"
                                        className="h-32 font-mono text-sm"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>Enter each feature on a new line.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </form>
            </Form>
        </div>
    );
};
