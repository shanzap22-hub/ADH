import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CourseSidebarItem } from "./course-sidebar-item";

interface CourseSidebarProps {
    course: any; // Type strictly later
    progressCount: number;
}

export const CourseSidebar = async ({
    course,
    progressCount
}: CourseSidebarProps) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user progress for chapters to mark completion
    // This logic allows us to pass isCompleted to items
    // For MVP we might just fetch all progress records for this user/course

    // Simplification: We will do this inside the map if data is small, or fetch once.
    // Fetching once is better.
    let completedChapters = new Set();
    if (user) {
        const { data: progress } = await supabase
            .from("user_progress")
            .select("chapter_id")
            .eq("user_id", user.id)
            .eq("is_completed", true);

        progress?.forEach(p => completedChapters.add(p.chapter_id));
    }

    // Check purchase to determine locks
    // If we call this component, we assume parent checked purchase or we check here?
    // Parent layout usually handles "can view course", but specific chapter locks depend.
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
