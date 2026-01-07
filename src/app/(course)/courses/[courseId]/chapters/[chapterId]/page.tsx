import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ChapterDetailPage({
    params
}: {
    params: Promise<{ courseId: string; chapterId: string }>
}) {
    try {
        const { courseId, chapterId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch chapter details
        const { data: chapter, error: chapterError } = await supabase
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

        if (chapterError || !chapter) {
            console.error("[CHAPTER_PAGE] Error fetching chapter:", chapterError);
            return redirect(`/courses/${courseId}`);
        }

        // Check enrollment
        let isEnrolled = false;
        if (user) {
            try {
                const { data: enrollment } = await supabase
                    .from("purchases")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("course_id", courseId)
                    .single();

                if (enrollment) {
                    isEnrolled = true;
                }
            } catch (error) {
                // Not enrolled, that's okay
                console.log("[CHAPTER_PAGE] User not enrolled");
            }
        }


        // The current chapter is already fetched above as 'chapter'
        // We just need to check if it's completed
        let isCompleted = false;
        if (user) {
            try {
                const { data: progress } = await supabase
                    .from("user_progress")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("chapter_id", chapterId)
                    .eq("is_completed", true)
                    .single();

                if (progress) {
                    isCompleted = true;
                }
            } catch (error) {
                // Progress tracking not available
            }
        }

        // Prepare current chapter data
        const currentChapterWithProgress = {
            ...chapter,
            isCompleted,
            isLocked: !isEnrolled && !chapter.is_free,
        };


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
                                <span>1 lesson</span>
                            </div>
                        </div>

                        {/* Progress */}
                        {isEnrolled && (
                            <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Status:
                                </span>
                                <div className="flex items-center gap-2">
                                    {currentChapterWithProgress.isCompleted ? (
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                            ✓ Completed
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                            In Progress
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Chapter Video - Show videos directly */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {currentChapterWithProgress.title}
                        </h2>

                        {currentChapterWithProgress.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {currentChapterWithProgress.description}
                            </p>
                        )}

                        {currentChapterWithProgress.video_url ? (
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe
                                    src={currentChapterWithProgress.video_url}
                                    className="w-full h-full"
                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                <p className="text-slate-500">No video uploaded yet</p>
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
    } catch (error) {
        console.error("[CHAPTER_PAGE] Fatal error:", error);
        return redirect(`/courses/${courseId}`);
    }
}
