import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LearnPageClient from "./LearnPageClient";

export default async function LearnPage({
    params,
    searchParams
}: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ lesson?: string }>;
}) {
    const { courseId } = await params;
    const { lesson } = await searchParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

    if (!enrollment) {
        return redirect(`/courses/${courseId}`);
    }

    // Fetch course chapters
    const { data: course } = await supabase
        .from("courses")
        .select(`
            *,
            chapters (
                id,
                title,
                description,
                video_url,
                position,
                is_published,
                is_free
            )
        `)
        .eq("id", courseId)
        .eq("chapters.is_published", true)
        .order("position", { foreignTable: "chapters", ascending: true })
        .single();

    if (!course || !course.chapters) {
        return redirect(`/courses/${courseId}`);
    }

    // Get user progress for all chapters
    const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("chapter_id", course.chapters.map((ch: any) => ch.id));

    // Prepare chapters with completion status
    const chaptersWithStatus = course.chapters.map((chapter: any) => {
        const progress = progressData?.find(p => p.chapter_id === chapter.id);
        return {
            ...chapter,
            isCompleted: progress?.is_completed || false,
            isLocked: false // All chapters unlocked for enrolled students
        };
    });

    // If no lesson specified, redirect to first lesson
    if (!lesson && chaptersWithStatus.length > 0) {
        return redirect(`/courses/${courseId}/learn?lesson=${chaptersWithStatus[0].id}`);
    }

    return (
        <LearnPageClient
            courseId={courseId}
            chapters={chaptersWithStatus}
        />
    );
}
