import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChapterClient } from "@/components/courses/ChapterClient";

export default async function ChapterIdPage({
    params
}: {
    params: Promise<{ courseId: string; chapterId: string }>
}) {
    const { courseId, chapterId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/");
    }

    const { data: chapter } = await supabase
        .from("chapters")
        .select("*")
        .eq("id", chapterId)
        .single();

    if (!chapter) {
        return redirect("/");
    }

    // Get chapter attachments
    const { data: attachmentsData } = await supabase
        .from("attachments")
        .select("id, name, url") // url, not file_url
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: true });

    return (
        <ChapterClient
            initialChapter={chapter}
            attachments={attachmentsData || []}
            courseId={courseId}
            chapterId={chapterId}
        />
    );
}
