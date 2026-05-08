import { createClient } from "@/lib/supabase/server";

export interface CourseProgress {
    courseId: string;
    progress: number;
}

/**
 * Calculates progress for multiple courses in a single set of database queries.
 * This avoids the N+1 query problem.
 */
export async function getBatchCourseProgress(userId: string, courseIds: string[]): Promise<Record<string, number>> {
    if (courseIds.length === 0) return {};

    try {
        const supabase = await createClient();

        // 1. Get all published chapters for these courses
        const { data: chapters, error: chaptersError } = await supabase
            .from("chapters")
            .select("id, course_id")
            .in("course_id", courseIds)
            .eq("is_published", true);

        if (chaptersError || !chapters) {
            console.error("[GET_BATCH_COURSE_PROGRESS] Chapters error:", chaptersError);
            return {};
        }

        // 2. Get all completed chapters for this user for these specific chapters
        const chapterIds = chapters.map(c => c.id);
        const { data: userProgress, error: progressError } = await supabase
            .from("user_progress")
            .select("chapter_id")
            .eq("user_id", userId)
            .eq("is_completed", true)
            .in("chapter_id", chapterIds);

        if (progressError) {
            console.error("[GET_BATCH_COURSE_PROGRESS] Progress error:", progressError);
            return {};
        }

        // 3. Map completed chapter IDs for quick lookup
        const completedChapterIds = new Set(userProgress?.map(p => p.chapter_id) || []);

        // 4. Group chapters by course and count completions
        const courseStats: Record<string, { total: number; completed: number }> = {};
        
        // Initialize stats for all courses
        courseIds.forEach(id => {
            courseStats[id] = { total: 0, completed: 0 };
        });

        // Tally chapters and completions
        chapters.forEach(chapter => {
            const stats = courseStats[chapter.course_id];
            if (stats) {
                stats.total += 1;
                if (completedChapterIds.has(chapter.id)) {
                    stats.completed += 1;
                }
            }
        });

        // 5. Calculate percentages
        const results: Record<string, number> = {};
        Object.entries(courseStats).forEach(([courseId, stats]) => {
            if (stats.total === 0) {
                results[courseId] = 0;
            } else {
                results[courseId] = Math.round((stats.completed / stats.total) * 100);
            }
        });

        return results;
    } catch (error) {
        console.error("[GET_BATCH_COURSE_PROGRESS] Exception:", error);
        return {};
    }
}
