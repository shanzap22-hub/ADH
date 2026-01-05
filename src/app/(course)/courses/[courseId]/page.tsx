import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import { CourseEnrollButton } from "@/components/course-enroll-button";
import { ChapterCard } from "@/components/course/ChapterCard";
import { BookOpen } from "lucide-react";

export default async function CourseIdPage({
    params
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch course with chapters and unit counts
    const { data: course } = await supabase
        .from("courses")
        .select(`
            *,
            chapters (
                id,
                title,
                description,
                thumbnail_url,
                position,
                is_published
            )
        `)
        .eq("id", courseId)
        .eq("chapters.is_published", true)
        .order("position", { foreignTable: "chapters", ascending: true })
        .single();

    if (!course) {
        return redirect("/");
    }

    // Check enrollment
    let isEnrolled = false;
    if (user) {
        const { data: enrollment } = await supabase
            .from("purchases")
            .select("*")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();

        if (enrollment) {
            isEnrolled = true;
        }
    }

    // Get unit counts and progress for each chapter
    const chaptersWithUnits = await Promise.all(
        (course.chapters || []).map(async (chapter) => {
            // Get units count
            const { count: unitsCount } = await supabase
                .from("units")
                .select("*", { count: "exact", head: true })
                .eq("chapter_id", chapter.id);

            // Get progress if enrolled
            let progress = 0;
            if (isEnrolled && user) {
                const { data: completedUnits } = await supabase
                    .from("user_progress")
                    .select("unit_id")
                    .eq("user_id", user.id)
                    .eq("is_completed", true)
                    .in("unit_id",
                        supabase
                            .from("units")
                            .select("id")
                            .eq("chapter_id", chapter.id)
                    );

                if (completedUnits && unitsCount) {
                    progress = (completedUnits.length / unitsCount) * 100;
                }
            }

            return {
                ...chapter,
                unitsCount: unitsCount || 0,
                progress,
            };
        })
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Course Header */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-6 p-6">
                        {/* Course Info */}
                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {course.title}
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400">
                                {course.description}
                            </p>

                            <Separator />

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-orange-500" />
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {chaptersWithUnits.length} chapters
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400">
                                        {chaptersWithUnits.reduce((acc, ch) => acc + ch.unitsCount, 0)} lessons
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Course Image & Enrollment */}
                        <div className="space-y-4">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800">
                                {course.image_url ? (
                                    <Image
                                        src={course.image_url}
                                        alt={course.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                                        <BookOpen className="h-16 w-16" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {course.price === 0
                                        ? "Free"
                                        : new Intl.NumberFormat("en-IN", {
                                            style: "currency",
                                            currency: "INR"
                                        }).format(course.price!)
                                    }
                                </p>
                                <CourseEnrollButton
                                    courseId={courseId}
                                    price={course.price!}
                                    isEnrolled={isEnrolled}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chapters Grid */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Course Chapters
                    </h2>

                    {chaptersWithUnits.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">
                                No chapters available yet
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {chaptersWithUnits.map((chapter) => (
                                <ChapterCard
                                    key={chapter.id}
                                    courseId={courseId}
                                    chapter={chapter}
                                    unitsCount={chapter.unitsCount}
                                    progress={chapter.progress}
                                    isLocked={!isEnrolled && chapter.unitsCount > 0}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
