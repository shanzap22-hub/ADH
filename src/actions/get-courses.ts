import { createClient } from "@/lib/supabase/server";

export type Course = {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number;
    is_published: boolean;
    created_at: string;
    chapter_count: number;
    category: string;
};

export const getCourses = async (searchQuery?: string): Promise<Course[]> => {
    try {
        const supabase = await createClient();

        let query = supabase
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
                    id,
                    is_published
                )
            `)
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        // Add search filter if provided
        if (searchQuery) {
            query = query.ilike("title", `%${searchQuery}%`);
        }

        const { data: courses, error } = await query;

        if (error) {
            console.error("[GET_COURSES]", error);
            return [];
        }

        if (!courses) {
            return [];
        }

        // Map courses with published chapter count
        const coursesWithCount = courses.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.image_url,
            price: course.price,
            is_published: course.is_published,
            created_at: course.created_at,
            chapter_count: course.chapters?.filter((ch: any) => ch.is_published)?.length || 0,
            category: "Technology", // Default category for now
        }));

        return coursesWithCount;
    } catch (error) {
        console.error("[GET_COURSES]", error);
        return [];
    }
};
