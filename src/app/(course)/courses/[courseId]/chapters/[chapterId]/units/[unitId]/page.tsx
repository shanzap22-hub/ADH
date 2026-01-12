import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle, Sparkles, Layout, PlayCircle } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

    // Parse resources if they exist
    const resources = Array.isArray(unit.resources) ? unit.resources : [];

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Cinema Video Area */}
            <div className="w-full bg-black/95 relative border-b border-slate-800 shadow-2xl">
                {/* Ambient Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 md:py-12">
                    <div className="relative aspect-video w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-slate-900 border border-slate-800/50">
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
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* Left: Main Details */}
                    <div className="flex-1 space-y-8">
                        {/* Header */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                                <span className="font-medium text-purple-600 dark:text-purple-400">{unit.chapters?.courses?.title}</span>
                                <ChevronRight className="h-4 w-4" />
                                <span className="text-slate-800 dark:text-slate-200">{unit.chapters?.title}</span>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {unit.title}
                                </h1>
                                {isCompleted && (
                                    <Badge className="bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-0 px-3 py-1 text-sm gap-1.5 self-start md:self-auto">
                                        <CheckCircle className="w-4 h-4" /> Completed
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-slate-200 dark:bg-slate-800" />

                        {/* Description */}
                        <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                            {unit.description ? (
                                <p>{unit.description}</p>
                            ) : (
                                <p className="text-slate-400 italic">No description available for this lesson.</p>
                            )}
                        </div>
                    </div>

                    {/* Right: Sidebar / Meta */}
                    <div className="w-full lg:w-96 space-y-6">
                        {/* Actions Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <Layout className="w-5 h-5 text-purple-600" />
                                Lesson Navigation
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {previousUnit ? (
                                    <Link href={`/courses/${courseId}/chapters/${chapterId}/units/${previousUnit.id}`} className="w-full">
                                        <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 group hover:border-purple-500/50">
                                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                            <div className="flex flex-col items-start truncate">
                                                <span className="text-xs text-slate-500">Previous</span>
                                            </div>
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="ghost" disabled className="w-full opacity-50 justify-start">Previous</Button>
                                )}

                                {nextUnit ? (
                                    <Link href={`/courses/${courseId}/chapters/${chapterId}/units/${nextUnit.id}`} className="w-full">
                                        <Button className="w-full justify-between gap-2 h-auto py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 group shadow-lg shadow-purple-500/10">
                                            <div className="flex flex-col items-start truncate">
                                                <span className="text-xs opacity-70">Next</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href={`/courses/${courseId}/chapters/${chapterId}`} className="w-full">
                                        <Button className="w-full justify-between gap-2 h-auto py-3 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
                                            Finish
                                            <CheckCircle className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Resources Card */}
                        {resources.length > 0 && (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                    <BookOpen className="w-5 h-5 text-orange-500" />
                                    Resources
                                </h3>
                                <div className="space-y-3">
                                    {resources.map((resource: any, index: number) => (
                                        <a
                                            key={index}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all group"
                                        >
                                            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <PlayCircle className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-300 truncate">
                                                {resource.title || resource.name || `Resource ${index + 1}`}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
