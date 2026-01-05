import { createClient } from "@/lib/supabase/server";
import { getCourseProgress } from "./get-course-progress";

export type DashboardCourse = {
    id: string;
    title: string;
    description: string | null;
    price: number | null;
    image_url: string | null;
    category: { name: string } | null;
    chaptersCount: number;
    chapters: {
        id: string;
    }[];
    progress: number | null;
};

export const getDashboardCourses = async (userId: string): Promise<DashboardCourse[]> => {
    try {
        const supabase = await createClient();

        // Fetch purchased courses for this user
        const { data: purchases, error: purchasesError } = await supabase
            .from("purchases")
            .select("course_id")
            .eq("user_id", userId);

        if (purchasesError) {
            console.error("[GET_DASHBOARD_COURSES]", purchasesError);
            return [];
        }

        if (!purchases || purchases.length === 0) {
            return [];
        }

        const courseIds = purchases.map((p) => p.course_id);

        // Fetch course details with ALL required fields
        const { data: courses, error: coursesError } = await supabase
            .from("courses")
            .select(`
                id,
                title,
                description,
                price,
                image_url,
                category_id,
                chapters (
                    id,
                    is_published
                )
            `)
            .in("id", courseIds)
            .eq("is_published", true);

        if (coursesError) {
            console.error("[GET_DASHBOARD_COURSES]", coursesError);
            return [];
        }

        if (!courses) {
            return [];
        }

        // Calculate progress for each course
        const coursesWithProgress = await Promise.all(
            courses.map(async (course: any) => {
                const progress = await getCourseProgress(userId, course.id);
                const publishedChapters = course.chapters?.filter((ch: any) => ch.is_published) || [];

                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    price: course.price,
                    image_url: course.image_url,
                    category: course.category_id ? { name: course.category_id } : null,
                    chaptersCount: publishedChapters.length,
                    chapters: publishedChapters,
                    progress,
                };
            })
        );

        return coursesWithProgress;
    } catch (error) {
        console.error("[GET_DASHBOARD_COURSES]", error);
        return [];
    }
};
