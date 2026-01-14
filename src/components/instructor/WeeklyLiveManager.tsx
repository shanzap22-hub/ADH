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
import { FileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, { message: "Title is required" }),
    banner_url: z.string().min(1, { message: "Banner image is required" }),
    join_url: z.string().min(1, { message: "Meeting link is required" }),
    scheduled_at: z.date({
        required_error: "A date and time is required.",
    }),
    time_str: z.string().min(1, { message: "Time is required" }), // Separate time input for simplicity
});

export const WeeklyLiveManager = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            banner_url: "",
            join_url: "",
            time_str: "10:00",
        },
    });

    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("/api/instructor/weekly-live");
                const data = await res.json();

                if (data) {
                    const date = new Date(data.scheduled_at);
                    form.reset({
                        id: data.id,
                        title: data.title || "",
                        banner_url: data.banner_url || "",
                        join_url: data.join_url || "",
                        scheduled_at: date,
                        time_str: format(date, "HH:mm"),
                    });
                }
            } catch (error) {
                console.error("Failed to fetch session", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, [form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSaving(true);
        try {
            // Combine date and time
            const DateTime = new Date(values.scheduled_at);
            const [hours, minutes] = values.time_str.split(':');
            DateTime.setHours(parseInt(hours), parseInt(minutes));

            const payload = {
                ...values,
                scheduled_at: DateTime.toISOString()
            };

            const response = await fetch("/api/instructor/weekly-live", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success("Live session updated successfully!");
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border shadow-sm">
            <h2 className="text-xl font-bold mb-6">Manage Weekly Live Class</h2>

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
                                        endpoint="courseImage"
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
                                <FormLabel>Session Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Weekly QA & Code Review" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Join Link */}
                    <FormField
                        control={form.control}
                        name="join_url"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meeting Link (Zoom/Meet/YouTube)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Date and Time */}
                    <div className="flex gap-4">
                        <FormField
                            control={form.control}
                            name="scheduled_at"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[240px] pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="time_str"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" {...field} className="w-[120px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Session
                    </Button>
                </form>
            </Form>
        </div>
    );
};
