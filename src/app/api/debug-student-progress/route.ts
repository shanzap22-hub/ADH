import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const email = 'help.avodha@gmail.com';

    try {
        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get all progress
        const { data: allProgress } = await supabase
            .from('user_progress')
            .select('*, chapters(id, title, course_id, courses(id, title))')
            .eq('user_id', profile.id);

        // Get completed progress
        const { data: completedProgress } = await supabase
            .from('user_progress')
            .select('user_id, is_completed, chapter_id')
            .eq('user_id', profile.id)
            .eq('is_completed', true);

        // Get unique courses
        const courseIds = new Set<string>();
        allProgress?.forEach((p: any) => {
            if (p.chapters?.course_id) {
                courseIds.add(p.chapters.course_id);
            }
        });

        // Get total chapters per course
        const { data: chapterCounts } = await supabase
            .from('chapters')
            .select('course_id, id, title')
            .in('course_id', Array.from(courseIds));

        const courseTotalChapters = new Map<string, number>();
        chapterCounts?.forEach((ch: any) => {
            const count = courseTotalChapters.get(ch.course_id) || 0;
            courseTotalChapters.set(ch.course_id, count + 1);
        });

        let totalChapters = 0;
        courseIds.forEach(courseId => {
            totalChapters += courseTotalChapters.get(courseId) || 0;
        });

        const completionPercentage = totalChapters > 0
            ? Math.round(((completedProgress?.length || 0) / totalChapters) * 100)
            : 0;

        return NextResponse.json({
            email,
            user_id: profile.id,
            all_progress_records: allProgress?.length || 0,
            completed_chapters: completedProgress?.length || 0,
            courses_enrolled: courseIds.size,
            total_chapters_in_courses: totalChapters,
            completion_percentage: completionPercentage,
            progress_details: allProgress?.map((p: any) => ({
                chapter: p.chapters?.title,
                course: p.chapters?.courses?.title,
                completed: p.is_completed,
                chapter_id: p.chapter_id
            })),
            all_chapters_in_courses: chapterCounts?.map((ch: any) => ({
                course_id: ch.course_id,
                chapter_id: ch.id,
                title: ch.title
            }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
