import { createClient } from "@/lib/supabase/server";

export type InstructorCourse = {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number;
    is_published: boolean;
    created_at: string;
    chapter_count: number;
};

export const getInstructorCourses = async (userId: string): Promise<InstructorCourse[]> => {
    try {
        const supabase = await createClient();

        const { data: courses, error } = await supabase
            .from("courses")
            .select(`
                id,
                title,
                description,
                image_url,
                price,
                is_published,
                created_at,
                chapters (
                    id
                )
            `)
            .eq("instructor_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("[GET_INSTRUCTOR_COURSES]", error);
            return [];
        }

        if (!courses) {
            return [];
        }

        // Map courses with chapter count
        const coursesWithCount = courses.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.image_url,
            price: course.price,
            is_published: course.is_published,
            created_at: course.created_at,
            chapter_count: course.chapters?.length || 0,
        }));

        return coursesWithCount;
    } catch (error) {
        console.error("[GET_INSTRUCTOR_COURSES]", error);
        return [];
    }
};
