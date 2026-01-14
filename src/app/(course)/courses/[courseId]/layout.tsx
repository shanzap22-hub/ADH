import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseSidebar } from "./_components/course-sidebar";

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

    // Sort chapters
    course.chapters.sort((a: any, b: any) => a.position - b.position);

    // Mock progress count
    const progressCount = 0;

    return (
        <div className="h-full">
            <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
                <CourseSidebar
                    course={course}
                    progressCount={progressCount}
                />
            </div>
            <main className="md:pl-80 h-full pt-0">
                {/* Removed fixed padding top */}
                {children}
            </main>
        </div>
    )
}
