"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateChapterProgress(
    courseId: string,
    chapterId: string,
    data: {
        isCompleted?: boolean;
        lastPlayedSecond?: number;
    }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Unauthorized");
        }

        const { isCompleted, lastPlayedSecond } = data;

        const upsertData: any = {
            user_id: user.id,
            chapter_id: chapterId,
            updated_at: new Date().toISOString(),
        };

        if (isCompleted !== undefined) {
            upsertData.is_completed = isCompleted;
        }

        if (lastPlayedSecond !== undefined) {
            upsertData.last_played_second = lastPlayedSecond;
        }

        const { error } = await supabase
            .from("user_progress")
            .upsert(upsertData, {
                onConflict: "user_id, chapter_id"
            });

        if (error) {
            console.error("[UPDATE_PROGRESS_ERROR]", error);
            throw new Error("Failed to update progress");
        }

        revalidatePath(`/courses/${courseId}`, "layout");

        return { success: true };
    } catch (error) {
        console.error("[UPDATE_PROGRESS]", error);
        return { success: false, error: "Something went wrong" };
    }
}
