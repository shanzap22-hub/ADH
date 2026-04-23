import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, ChevronRight, ArrowLeft, BookOpen, FileText, HelpCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CourseContentBackButton } from "../../_components/course-content-back-button";

export default async function ChapterDetailPage({
    params
}: {
    params: Promise<{ courseId: string; chapterId: string }>
}) {
    const { courseId, chapterId } = await params;
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch course and chapter details
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .select(`
                *,
                courses (
                    id,
                    title,
                    description,
                    is_published
                )
            `)
            .eq("id", chapterId)
            .single();

        if (chapterError || !chapter) {
            return redirect(`/courses/${courseId}`);
        }

        // Fetch ALL published chapters to determine Prev/Next navigation
        const { data: allChapters } = await supabase
            .from("chapters")
            .select("id, position, title, is_free")
            .eq("course_id", courseId)
            .eq("is_published", true)
            .order("position", { ascending: true });

        const currentChapterIndex = allChapters?.findIndex((c) => c.id === chapterId) ?? -1;
        const nextChapter = currentChapterIndex !== -1 && allChapters ? allChapters[currentChapterIndex + 1] : null;
        const prevChapter = currentChapterIndex !== -1 && allChapters ? allChapters[currentChapterIndex - 1] : null;

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

                if (enrollment) isEnrolled = true;
            } catch (error) { }
        }

        // Check progress
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

                if (progress) isCompleted = true;
            } catch (error) { }
        }

        const isLocked = !isEnrolled && !chapter.is_free;

        return (
            <div className="h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden pt-14">
                <div className="flex-1 w-full overflow-y-auto">
                    <div className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-4">

                        <div className="flex items-start justify-between">
                            <CourseContentBackButton href={`/courses/${courseId}`} label="Back to Course" />
                        </div>

                        {/* 2. Title & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <p className="text-orange-500 font-medium text-sm mb-1">Lesson {chapter.position}</p>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                                    {chapter.title}
                                </h1>
                            </div>

                            {isCompleted && (
                                <div className="flex items-center gap-1.5 text-green-600 border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium self-start">
                                    <div className="w-4 h-4 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px]">✓</div>
                                    Completed
                                </div>
                            )}
                        </div>

                        {/* Video Player Section */}
                        <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video relative">
                            {isLocked ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                                    <div className="mb-4 text-4xl">🔒</div>
                                    <h2 className="text-xl font-bold mb-2">Lesson Locked</h2>
                                    <p className="text-slate-400 mb-6 max-w-md">Enroll in this course to get access to this lesson and all other content.</p>
                                    <Link href={`/courses/${courseId}`}>
                                        <Button className="font-bold bg-white text-black hover:bg-slate-200">
                                            Subscribe Now
                                        </Button>
                                    </Link>
                                </div>
                            ) : chapter.video_url ? (
                                <iframe
                                    key={chapter.id}
                                    src={chapter.video_url}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-400">
                                    No video content available
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between">
                            <Link href={prevChapter ? `/courses/${courseId}/chapters/${prevChapter.id}` : "#"} className={!prevChapter ? "pointer-events-none" : ""}>
                                <Button variant="outline" disabled={!prevChapter} className="gap-2">
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                            </Link>

                            <div className="flex items-center gap-2">
                                {/* Mark Complete Button could go here */}
                                {isCompleted && <span className="text-sm text-green-600 font-medium">✓ Completed</span>}
                            </div>

                            <Link href={nextChapter ? `/courses/${courseId}/chapters/${nextChapter.id}` : "#"} className={!nextChapter ? "pointer-events-none" : ""}>
                                <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black">
                                    Next Lesson
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                            {/* Main Content: Tabs */}
                            <div className="lg:col-span-2">
                                <Tabs defaultValue="about" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 dark:bg-slate-800 p-1">
                                        <TabsTrigger value="about" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                            <Info className="w-4 h-4 mr-2" /> About
                                        </TabsTrigger>
                                        <TabsTrigger value="resources" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                            <FileText className="w-4 h-4 mr-2" /> Resources
                                        </TabsTrigger>
                                        <TabsTrigger value="questions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
                                            <HelpCircle className="w-4 h-4 mr-2" /> Questions
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="about" className="space-y-4">
                                        <div className="prose dark:prose-invert max-w-none">
                                            <h2 className="text-2xl font-bold mb-2">{chapter.title}</h2>
                                            <div dangerouslySetInnerHTML={{ __html: chapter.description || "" }} />
                                            {!chapter.description && <p className="text-slate-500 italic">No description provided for this lesson.</p>}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="resources" className="space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-8 text-center text-slate-500">
                                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>No resources attached to this lesson.</p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="questions" className="space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-8 text-center text-slate-500">
                                            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                            <p>Q&A section coming soon.</p>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Sidebar (Optional - Course items could be shown here as sidebar) */}
                            {/* For now leaving empty or could show Up Next */}
                        </div>

                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("[CHAPTER_PAGE] Fatal error:", error);
        return redirect(`/courses/${courseId}`);
    }
}
