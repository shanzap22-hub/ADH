import { createClient } from "@/lib/supabase/server";
import { CoursesList } from "@/components/courses-list";

export default async function SearchPage() {
    const supabase = await createClient();

    const { data: courses } = await supabase
        .from("courses")
        .select(`
            *,
            chapters (
                id
            )
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

    // Mock progress and category for now
    const coursesWithMockData = courses?.map((course: any) => ({
        ...course,
        category: null, // To be implemented with Category table
        chapters: course.chapters || [],
        progress: null, // To be implemented with User Progress
    })) || [];


    return (
        <div className="p-6">
            <CoursesList items={coursesWithMockData} />
        </div>
    );
}
