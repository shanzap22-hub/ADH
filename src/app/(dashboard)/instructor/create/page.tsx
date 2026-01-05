"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function CreateCoursePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Unauthorized", { description: "You must be logged in to create a course." });
                return;
            }

            const { data, error } = await supabase
                .from("courses")
                .insert({
                    title,
                    instructor_id: user.id
                })
                .select()
                .single();

            if (error) {
                toast.error("Something went wrong", { description: error.message });
            } else {
                toast.success("Course created!");
                router.push(`/instructor/courses`); // Ideally to edit page, but list for now
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto flex md:items-center md:justify-center h-full p-6">
            <div className="w-full">
                <h1 className="text-2xl font-bold">Name your course</h1>
                <p className="text-sm text-muted-foreground mb-8">
                    What would you like to name your course? Don't worry, you can change this later.
                </p>
                <form onSubmit={onSubmit} className="space-y-8 mt-8">
                    <div className="space-y-2">
                        <Label>Course Title</Label>
                        <Input
                            disabled={loading}
                            placeholder="e.g. 'Advanced Web Development'"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <p className="text-sm text-muted-foreground">
                            What will you teach in this course?
                        </p>
                    </div>
                    <div className="flex items-center gap-x-2">
                        <Link href="/instructor/courses">
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={!title || loading}>
                            {loading ? "Creating..." : "Continue"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
