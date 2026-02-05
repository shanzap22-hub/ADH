import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LearnPageClient from "./LearnPageClient";

export default async function LearnPage({
    params,
    searchParams
}: {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ lesson?: string }>;
}) {
    const { courseId } = await params;
    const { lesson } = await searchParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/login");
    }

    // Check enrollment
    const { data: enrollment } = await supabase
        .from("purchases")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

    // Check Tier Access (Fix for automatic redirect)
    let hasTierAccess = false;
    try {
        const { data: profile } = await supabase
            .from("profiles")
            .select("membership_tier, role")
            .eq("id", user.id)
            .single();

        // 1. Check Admin/Instructor Access
        const userRole = profile?.role;
        if (["super_admin", "admin", "instructor"].includes(userRole)) {
            hasTierAccess = true;
        } else {
            // 2. Check Tier Access
            const userTier = profile?.membership_tier?.toLowerCase();

            const { data: allowedTiers } = await supabase
                .from("course_tier_access")
                .select("tier")
                .eq("course_id", courseId);

            if (userTier && allowedTiers && allowedTiers.length > 0) {
                // Strict Match logic as requested - no presets/hierarchy
                hasTierAccess = allowedTiers.some((t: any) => t.tier?.toLowerCase() === userTier);
            }
        }
    } catch (err) {
        console.error("Tier Check Error:", err);
    }

    if (!enrollment && !hasTierAccess) {
        return redirect(`/courses/${courseId}`);
    }

    // Fetch course chapters
    const { data: course } = await supabase
        .from("courses")
        .select(`
            *,
            chapters (
                id,
                title,
                description,
                video_url,
                position,
                is_published,
                is_free
            )
        `)
        .eq("id", courseId)
        .eq("chapters.is_published", true)
        .order("position", { foreignTable: "chapters", ascending: true })
        .single();

    if (!course || !course.chapters) {
        return redirect(`/courses/${courseId}`);
    }

    // Get user progress for all chapters
    const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .in("chapter_id", course.chapters.map((ch: any) => ch.id));

    // Get attachments for all chapters
    const { data: attachmentsData } = await supabase
        .from("attachments")
        .select("*")
        .in("chapter_id", course.chapters.map((ch: any) => ch.id));

    // Prepare chapters with completion status and attachments
    const chaptersWithStatus = course.chapters.map((chapter: any) => {
        const progress = progressData?.find(p => p.chapter_id === chapter.id);
        const attachments = attachmentsData?.filter(a => a.chapter_id === chapter.id) || [];

        return {
            ...chapter,
            isCompleted: progress?.is_completed || false,
            lastPlayedSecond: progress?.last_played_second || 0,
            isLocked: false, // All chapters unlocked for enrolled students
            attachments
        };
    });

    // If no lesson specified, redirect to first lesson
    if (!lesson && chaptersWithStatus.length > 0) {
        return redirect(`/courses/${courseId}/learn?lesson=${chaptersWithStatus[0].id}`);
    }

    return (
        <LearnPageClient
            courseId={courseId}
            chapters={chaptersWithStatus}
        />
    );
}
