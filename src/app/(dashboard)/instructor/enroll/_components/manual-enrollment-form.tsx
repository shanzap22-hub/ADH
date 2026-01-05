"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

const formSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    courseId: z.string().min(1, { message: "Please select a course" }),
});

interface ManualEnrollmentFormProps {
    courses: { id: string; title: string }[];
}

export function ManualEnrollmentForm({ courses }: ManualEnrollmentFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            courseId: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/manual-enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to enroll student");
            }

            toast.success("Student enrolled successfully!");
            form.reset();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to enroll student");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Student Email</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="student@example.com"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                                The email address of the student you want to enroll
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Course</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                <FormControl>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-slate-400">
                                The course the student will get access to
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enrolling...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Grant Access
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
