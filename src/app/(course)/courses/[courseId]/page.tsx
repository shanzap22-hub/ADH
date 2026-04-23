import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseHero } from "@/components/course/CourseHero";
import { CourseProgress } from "@/components/course/CourseProgress";
import { CourseStartButton } from "@/components/course/CourseStartButton";
import { CourseTOCPreview } from "@/components/course/CourseTOCPreview";
import { CourseEnrollButton } from "@/components/course-enroll-button";
import { getBunnyVideoLength } from "@/actions/bunny";
import { CourseContentBackButton } from "./_components/course-content-back-button";

// 2026 Performance: ISR - Revalidate every hour
// Reduces database load while keeping course data fresh
export const revalidate = 3600;

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
    // Check Enrollment (Purchase OR Tier Access)
    let isEnrolled = false;
    if (user) {
        // 1. Check direct purchase
        const { data: enrollment } = await supabase
            .from("purchases")
            .select("*")
            .eq("user_id", user.id)
            .eq("course_id", courseId)
            .single();

        if (enrollment) {
            isEnrolled = true;
        } else {
            // 2. Check Tier / Role Access
            const { data: profile } = await supabase
                .from("profiles")
                .select("membership_tier, role")
                .eq("id", user.id)
                .single();

            const userTier = profile?.membership_tier;
            const userRole = profile?.role;

            // Admins & Instructors get access
            if (["super_admin", "admin", "instructor"].includes(userRole)) {
                isEnrolled = true;
            } else {
                // Check if course allows this user's tier
                const { data: allowedTiers } = await supabase
                    .from("course_tier_access")
                    .select("tier")
                    .eq("course_id", courseId);

                // Exact match logic (consistent with accessible-courses action)
                if (allowedTiers?.some(t => t.tier === userTier)) {
                    isEnrolled = true;
                }
            }
        }
    }

    // Strict Access Control: Redirect if not enrolled/authorized
    if (!isEnrolled || !user) {
        return redirect("/courses");
    }

    const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("chapter_id", course.chapters?.map((ch: any) => ch.id) || []);

    let completedLessons = 0;
    let lastViewedChapterId: string | undefined;

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
            try {
                let videoId = "";
                let libraryId: string | undefined = undefined;

                // Check if URL is just a GUID (Video ID)
                const cleanUrl = chapter.video_url.trim();
                const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUrl);

                if (cleanUrl.startsWith("bunny://")) {
                    // Handle custom bunny://VIDEO_ID format
                    videoId = cleanUrl.replace("bunny://", "");
                } else if (isGuid) {
                    videoId = cleanUrl;
                } else {
                    // Support embed/LIB/VID and play/LIB/VID
                    const match = cleanUrl.match(/(?:embed|play)\/([^\/]+)\/([^\/?]+)/);
                    if (match && match[2]) {
                        libraryId = match[1];
                        videoId = match[2];
                    }
                }

                if (videoId) {
                    // If libraryId is undefined, getBunnyVideoLength uses the ENV var default
                    const durationSec = await getBunnyVideoLength(videoId, libraryId);

                    if (durationSec > 0) {
                        const minutes = Math.floor(durationSec / 60);
                        const seconds = durationSec % 60;
                        durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-[env(safe-area-inset-top)]">
            <div className="max-w-6xl mx-auto p-4 space-y-8">
                {/* Back Button */}
                <CourseContentBackButton href="/courses" label="Back to Courses" />

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
