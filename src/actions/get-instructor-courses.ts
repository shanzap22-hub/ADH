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
        console.log("[GET_INSTRUCTOR_COURSES] Fetching courses for user:", userId);
        const supabase = await createClient();

        // Check if user is super admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        const isSuperAdmin = profile?.role === 'super_admin';
        console.log("[GET_INSTRUCTOR_COURSES] User role:", profile?.role, "Is super admin:", isSuperAdmin);

        // Build query - super admin sees ALL courses, instructors see only their own
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
                instructor_id,
                chapters (
                    id
                )
            `)
            .order("created_at", { ascending: false });

        // Only filter by instructor_id if NOT super admin
        if (!isSuperAdmin) {
            query = query.eq("instructor_id", userId);
        }

        const { data: courses, error } = await query;

        if (error) {
            console.error("[GET_INSTRUCTOR_COURSES] Supabase error:", error);
            console.error("[GET_INSTRUCTOR_COURSES] Error details:", JSON.stringify(error, null, 2));
            return [];
        }

        if (!courses) {
            console.log("[GET_INSTRUCTOR_COURSES] No courses found");
            return [];
        }

        console.log("[GET_INSTRUCTOR_COURSES] Found courses:", courses.length);

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
        console.error("[GET_INSTRUCTOR_COURSES] Fatal error:", error);
        console.error("[GET_INSTRUCTOR_COURSES] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        return [];
    }
};
