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
    name: z.string().optional(),
    email: z.string().email({ message: "Invalid email address" }),
    tier: z.string().min(1, { message: "Please select a membership tier" }),
});

export function ManualEnrollmentForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            tier: "",
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to enroll student");
            }

            // Show success message (includes password if new user)
            toast.success(data.message, { duration: 10000 });
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
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Student Name (Optional if user exists)</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="John Doe"
                                    {...field}
                                    disabled={isSubmitting}
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </FormControl>
                            <FormDescription className="text-slate-400">
                                Required only for new students.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

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
                                The email address of the student/user.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-white">Membership Tier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                <FormControl>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Select Tier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="bronze">Bronze</SelectItem>
                                    <SelectItem value="silver">Silver (Most Popular)</SelectItem>
                                    <SelectItem value="gold">Gold (VIP)</SelectItem>
                                    <SelectItem value="platinum">Platinum</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormDescription className="text-slate-400">
                                This will grant access to all courses and features in this tier.
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
                            Upgrading...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Grant Membership
                        </>
                    )}
                </Button>
            </form>
        </Form>
    );
}
