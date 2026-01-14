import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseHero } from "@/components/course/CourseHero";
import { CourseProgress } from "@/components/course/CourseProgress";
import { CourseStartButton } from "@/components/course/CourseStartButton";
import { CourseTOCPreview } from "@/components/course/CourseTOCPreview";
import { CourseEnrollButton } from "@/components/course-enroll-button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBunnyVideoLength } from "@/actions/bunny";

export default async function CourseIdPage({
    params
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch course with chapters
    const { data: course } = await supabase
        .from("courses")
        .select(`
            *,
            chapters (
                id,
                title,
                description,
                position,
                is_published,
                is_free,
                video_url
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

    // Get user progress
    let completedLessons = 0;
    let lastViewedChapterId: string | undefined;
    let progressData: any[] | null = null;

    if (user && isEnrolled) {
        const { data } = await supabase
            .from("user_progress")
            .select("*")
            .eq("user_id", user.id)
            .in("chapter_id", course.chapters?.map((ch: any) => ch.id) || []);

        progressData = data;

        if (progressData) {
            completedLessons = progressData.filter(p => p.is_completed).length;

            // Get last viewed chapter (most recently updated)
            const sortedProgress = [...progressData].sort((a, b) =>
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
            if (sortedProgress.length > 0) {
                lastViewedChapterId = sortedProgress[0].chapter_id;
            }
        }
    }

    const chapters = course.chapters || [];
    const totalLessons = chapters.length;
    const firstChapterId = chapters[0]?.id;
    const hasProgress = completedLessons > 0;

    // Prepare chapters with completion status & duration
    const chaptersWithStatus = await Promise.all(chapters.map(async (chapter: any) => {
        let isCompleted = false;
        if (progressData) {
            const progress = progressData.find((p: any) => p.chapter_id === chapter.id);
            if (progress?.is_completed) isCompleted = true;
        }

        // Fetch duration if video exists
        let durationStr = "0:00";
        if (chapter.video_url) {
            // Extract video ID and Library ID from Bunny embed URL
            try {
                // Regex to capture libraryId and videoId: /embed/{libraryId}/{videoId}
                const match = chapter.video_url.match(/embed\/([^\/]+)\/([^\/?]+)/);
                if (match && match[2]) {
                    const libraryId = match[1];
                    const videoId = match[2];
                    // Pass libraryId explicitly to handle cases where it differs from env var
                    const durationSec = await getBunnyVideoLength(videoId, libraryId);

                    const minutes = Math.floor(durationSec / 60);
                    const seconds = durationSec % 60;
                    durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                }
            } catch (e) {
                console.error("Error fetching duration", e);
            }
        }

        return {
            ...chapter,
            isCompleted,
            isLocked: !isEnrolled && !chapter.is_free,
            duration: durationStr
        };
    }));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="max-w-6xl mx-auto p-4 space-y-8">
                {/* Back Button */}
                <Link
                    href="/courses"
                    className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Courses
                </Link>

                {/* Hero Section */}
                <CourseHero
                    title={course.title}
                    description={course.description}
                    imageUrl={course.image_url}
                    chaptersCount={chapters.length}
                    lessonsCount={totalLessons}
                />

                {/* Progress & CTA Section */}
                {isEnrolled && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <CourseProgress
                            completedLessons={completedLessons}
                            totalLessons={totalLessons}
                        />

                        <CourseStartButton
                            courseId={courseId}
                            hasProgress={hasProgress}
                            firstChapterId={firstChapterId}
                            lastViewedChapterId={lastViewedChapterId}
                            isEnrolled={isEnrolled}
                        />
                    </div>
                )}

                {/* Not Enrolled State */}
                {!isEnrolled && (
                    <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl p-8 text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Enroll to Start Learning
                        </h3>
                        <p className="text-orange-100 mb-6">
                            Get access to all {totalLessons} lessons in this course
                        </p>
                        <CourseEnrollButton
                            courseId={courseId}
                            price={course.price}
                            isEnrolled={isEnrolled}
                        />
                    </div>
                )}

                {/* Table of Contents */}
                <CourseTOCPreview chapters={chaptersWithStatus} courseId={courseId} />
            </div>
        </div>
    );
}
