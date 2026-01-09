import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseSidebar } from "./_components/course-sidebar";
// import { Navbar } from "@/components/navbar-routes"; // We might need a specific navbar for course view or reuse existing?
// Let's create a simple Mobile Header later. For now, just desktop sidebar + main content.

export default async function CourseLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    //   if (!user) {
    //     return redirect("/");
    //   }

    const { data: course } = await supabase
        .from("courses")
        .select(`
        *,
        chapters (
            id,
            title,
            description,
            video_url,
            is_published,
            is_free,
            position
        )
    `)
        .eq("id", courseId)
        .single();

    if (!course) {
        return redirect("/");
    }

    // Get user progress
    const { data: progressData } = await supabase
        .from("user_progress")
        .select("chapter_id, is_completed")
        .eq("user_id", user.id)
        .in("chapter_id", course.chapters.map((ch: any) => ch.id));

    // Sort chapters and add progress
    course.chapters.sort((a: any, b: any) => a.position - b.position);

    // Merge progress into chapters
    const chaptersWithProgress = course.chapters.map((chapter: any) => ({
        ...chapter,
        isCompleted: progressData?.find((p: any) => p.chapter_id === chapter.id)?.is_completed || false
    }));

    // Mock progress count
    const progressCount = 0;

    return (
        <div className="h-full">
    // Merge progress into chapters
    const chaptersWithProgress = course.chapters.map((chapter: any) => ({
                ...chapter,
                isCompleted: progressData?.find((p: any) => p.chapter_id === chapter.id)?.is_completed || false
    }));

            return (
            <div className="h-full">
                <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                    <CourseSidebar
                        course={course}
                        progressCount={progressCount}
                    />
                </div>
                <main className="md:pl-80 h-full pt-[80px]">
                    <main className="md:pl-80 h-full pt-[80px]">
                        {/* Added padding top for header if we add one, or 0 if not */}
                        {children}
                    </main>
            </div>
            )
}
