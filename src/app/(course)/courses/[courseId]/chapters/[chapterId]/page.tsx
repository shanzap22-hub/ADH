import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, BookOpen } from "lucide-react";
import { UnitCard } from "@/components/course/UnitCard";
import { Button } from "@/components/ui/button";

export default async function ChapterDetailPage({
    params
}: {
    params: Promise<{ courseId: string; chapterId: string }>
}) {
    const { courseId, chapterId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch chapter details
    const { data: chapter } = await supabase
        .from("chapters")
        .select(`
            *,
            courses (
                id,
                title,
                is_published
            )
        `)
        .eq("id", chapterId)
        .single();

    if (!chapter || !chapter.courses) {
        return redirect(`/courses/${courseId}`);
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

    // Fetch units for this chapter
    const { data: units } = await supabase
        .from("units")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("position", { ascending: true });

    // Get completion status for each unit
    const unitsWithProgress = await Promise.all(
        (units || []).map(async (unit) => {
            let isCompleted = false;

            if (user) {
                const { data: progress } = await supabase
                    .from("user_progress")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("unit_id", unit.id)
                    .eq("is_completed", true)
                    .single();

                if (progress) {
                    isCompleted = true;
                }
            }

            return {
                ...unit,
                isCompleted,
                isLocked: !isEnrolled && !unit.is_free_preview,
            };
        })
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link
                        href={`/courses/${courseId}`}
                        className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        {chapter.courses?.title || "Course"}
                    </Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-600 dark:text-slate-400">{chapter.title}</span>
                </div>

                {/* Chapter Header */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                {chapter.title}
                            </h1>
                            {chapter.description && (
                                <p className="text-lg text-slate-600 dark:text-slate-400">
                                    {chapter.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <BookOpen className="h-5 w-5" />
                            <span>{unitsWithProgress.length} lessons</span>
                        </div>
                    </div>

                    {/* Progress */}
                    {isEnrolled && (
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                Progress:
                            </span>
                            <div className="flex-1 max-w-xs">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-500 to-pink-600 transition-all"
                                            style={{
                                                width: `${(unitsWithProgress.filter(u => u.isCompleted).length / unitsWithProgress.length) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        {unitsWithProgress.filter(u => u.isCompleted).length}/{unitsWithProgress.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Units List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Lessons in this Chapter
                    </h2>

                    {unitsWithProgress.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">
                                No lessons available yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {unitsWithProgress.map((unit) => (
                                <UnitCard
                                    key={unit.id}
                                    courseId={courseId}
                                    chapterId={chapterId}
                                    unit={unit}
                                    isCompleted={unit.isCompleted}
                                    isLocked={unit.isLocked}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Not Enrolled Message */}
                {!isEnrolled && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 text-center">
                        <p className="text-orange-900 dark:text-orange-100 mb-4">
                            Enroll in this course to access all lessons
                        </p>
                        <Link href={`/courses/${courseId}`}>
                            <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
                                Go to Course Page
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
