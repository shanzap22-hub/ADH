import { createClient } from "@/lib/supabase/server";

export async function getAllCourses() {
    const supabase = await createClient();

    const { data: courses, error } = await supabase
        .from('courses')
        .select(`
            id,
            title,
            description,
            image_url,
            price,
            is_published,
            created_at,
            instructor_id,
            profiles!courses_instructor_id_fkey (
                email,
                full_name
            ),
            chapters (
                id
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[GET_ALL_COURSES] Error:', error);
        return [];
    }

    return courses.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        image_url: course.image_url,
        price: course.price,
        is_published: course.is_published,
        created_at: course.created_at,
        instructor_id: course.instructor_id,
        instructor_email: course.profiles?.email || 'Unknown',
        instructor_name: course.profiles?.full_name || 'Unknown',
        chapter_count: course.chapters?.length || 0,
    }));
}
