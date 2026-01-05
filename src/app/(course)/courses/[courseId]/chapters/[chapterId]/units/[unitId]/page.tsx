import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function UnitPlayerPage({
    params
}: {
    params: Promise<{ courseId: string; chapterId: string; unitId: string }>
}) {
    const { courseId, chapterId, unitId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/");
    }

    // Fetch unit details
    const { data: unit } = await supabase
        .from("units")
        .select(`
            *,
            chapters (
                id,
                title,
                courses (
                    id,
                    title
                )
            )
        `)
        .eq("id", unitId)
        .single();

    if (!unit || !unit.chapters) {
        return redirect(`/courses/${courseId}`);
    }

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

    const isEnrolled = !!enrollment;
    const canAccess = unit.is_free_preview || isEnrolled;

    if (!canAccess) {
        return redirect(`/courses/${courseId}/chapters/${chapterId}`);
    }

    // Get completion status
    const { data: progress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("unit_id", unitId)
        .single();

    const isCompleted = progress?.is_completed || false;

    // Get all units in this chapter for navigation
    const { data: allUnits } = await supabase
        .from("units")
        .select("id, position")
        .eq("chapter_id", chapterId)
        .order("position", { ascending: true });

    // Find previous and next units
    const currentIndex = allUnits?.findIndex(u => u.id === unitId) ?? -1;
    const previousUnit = currentIndex > 0 ? allUnits?.[currentIndex - 1] : null;
    const nextUnit = currentIndex < (allUnits?.length ?? 0) - 1 ? allUnits?.[currentIndex + 1] : null;

    // Mark as complete handler
    const completeOnEnd = async () => {
        "use server";
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        await supabase
            .from("user_progress")
            .upsert({
                user_id: user.id,
                unit_id: unitId,
                chapter_id: chapterId,
                is_completed: true,
            });
    };

    // Parse resources if they exist
    const resources = Array.isArray(unit.resources) ? unit.resources : [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-6xl mx-auto p-6 space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link
                        href={`/courses/${courseId}`}
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                        {unit.chapters?.courses?.title || "Course"}
                    </Link>
                    <span className="text-slate-400">/</span>
                    <Link
                        href={`/courses/${courseId}/chapters/${chapterId}`}
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                    >
                        {unit.chapters?.title || "Chapter"}
                    </Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-600 dark:text-slate-400">{unit.title}</span>
                </div>

                {/* Video Player */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <VideoPlayer
                        chapterId={chapterId}
                        title={unit.title}
                        courseId={courseId}
                        nextChapterId={nextUnit?.id}
                        isLocked={false}
                        completeOnEnd={true}
                        videoUrl={unit.video_url || unit.bunny_video_id || ""}
                    />
                </div>

                {/* Unit Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {unit.title}
                            </h1>
                            {unit.description && (
                                <p className="text-slate-600 dark:text-slate-400">
                                    {unit.description}
                                </p>
                            )}
                        </div>
                        {isCompleted && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Completed</span>
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    {resources.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                    Resources
                                </h3>
                                <div className="space-y-2">
                                    {resources.map((resource: any, index: number) => (
                                        <a
                                            key={index}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                                        >
                                            <BookOpen className="h-4 w-4 text-orange-500" />
                                            <span className="text-sm font-medium">{resource.title || resource.name || `Resource ${index + 1}`}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                    {previousUnit ? (
                        <Link href={`/courses/${courseId}/chapters/${chapterId}/units/${previousUnit.id}`}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <ChevronLeft className="h-4 w-4" />
                                Previous Lesson
                            </Button>
                        </Link>
                    ) : (
                        <div />
                    )}

                    {nextUnit ? (
                        <Link href={`/courses/${courseId}/chapters/${chapterId}/units/${nextUnit.id}`}>
                            <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
                                Next Lesson
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    ) : (
                        <Link href={`/courses/${courseId}/chapters/${chapterId}`}>
                            <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700">
                                Back to Chapter
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
