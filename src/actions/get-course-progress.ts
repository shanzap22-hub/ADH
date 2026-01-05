import { createClient } from "@/lib/supabase/server";

export const getCourseProgress = async (userId: string, courseId: string): Promise<number> => {
    try {
        const supabase = await createClient();

        // Get all chapters for the course
        const { data: chapters, error: chaptersError } = await supabase
            .from("chapters")
            .select("id")
            .eq("course_id", courseId)
            .eq("is_published", true);

        if (chaptersError || !chapters || chapters.length === 0) {
            return 0;
        }

        // Get completed chapters for this user
        const { data: progress, error: progressError } = await supabase
            .from("user_progress")
            .select("chapter_id")
            .eq("user_id", userId)
            .eq("is_completed", true)
            .in("chapter_id", chapters.map(c => c.id));

        if (progressError) {
            console.error("[GET_COURSE_PROGRESS]", progressError);
            return 0;
        }

        const completedCount = progress?.length || 0;
        const totalChapters = chapters.length;

        const progressPercentage = (completedCount / totalChapters) * 100;

        return Math.round(progressPercentage);
    } catch (error) {
        console.error("[GET_COURSE_PROGRESS]", error);
        return 0;
    }
};
