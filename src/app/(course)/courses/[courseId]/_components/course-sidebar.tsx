import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CourseSidebarItem } from "./course-sidebar-item";
import { CourseSidebarBackButton } from "./course-sidebar-back-button";

interface CourseSidebarProps {
    course: any;
    progressCount: number;
}

export const CourseSidebar = async ({
    course,
    progressCount
}: CourseSidebarProps) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Optimized progress fetching
    let completedChapters = new Set<string>();

    if (user && course?.chapters) {
        // Get all chapter IDs for this course
        const chapterIds = course.chapters.map((c: any) => c.id);

        if (chapterIds.length > 0) {
            const { data: progress } = await supabase
                .from("user_progress")
                .select("chapter_id")
                .eq("user_id", user.id)
                .in("chapter_id", chapterIds)
                .eq("is_completed", true);

            progress?.forEach(p => completedChapters.add(p.chapter_id));
        }
    }

    // Check purchase to determine locks
    let hasPurchase = false;
    if (user) {
        const { data: purchase } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("course_id", course.id)
            .single();
        hasPurchase = !!purchase;
    }

    return (
        <div className="h-full border-r flex flex-col overflow-y-auto shadow-sm">
            <div className="p-8 flex flex-col border-b">
                <CourseSidebarBackButton />
                <h1 className="font-semibold">
                    {course.title}
                </h1>
                {/* Progress Bar can go here */}
            </div>
            <div className="flex flex-col w-full">
                {course.chapters.map((chapter: any) => (
                    <CourseSidebarItem
                        key={chapter.id}
                        id={chapter.id}
                        label={chapter.title}
                        isCompleted={completedChapters.has(chapter.id)}
                        courseId={course.id}
                        isLocked={!chapter.is_free && !hasPurchase}
                    />
                ))}
            </div>
        </div>
    )
}
