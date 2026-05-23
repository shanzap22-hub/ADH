"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { awardPointsAction } from "@/app/actions/gamification";

export async function updateChapterProgress(
    courseId: string,
    chapterId: string,
    data: {
        isCompleted?: boolean;
        lastPlayedSecond?: number;
        unitId?: string; // Unit-level progress — save separately
    }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            throw new Error("Unauthorized");
        }

        const { isCompleted, lastPlayedSecond, unitId } = data;

        // -------------------------------------------------------
        // Unit-level progress (upsert by user_id + unit_id)
        // Unit page-ൽ resume ചെയ്യാൻ unit_id ഉപയോഗിക്കണം
        // -------------------------------------------------------
        if (unitId) {
            const unitUpsertData: Record<string, unknown> = {
                user_id: user.id,
                chapter_id: chapterId,
                unit_id: unitId,
                updated_at: new Date().toISOString(),
            };

            if (isCompleted !== undefined) {
                unitUpsertData.is_completed = isCompleted;
            }

            if (lastPlayedSecond !== undefined) {
                unitUpsertData.last_played_second = lastPlayedSecond;
            }

            const { error } = await supabase
                .from("user_progress")
                .upsert(unitUpsertData, {
                    onConflict: "user_id, unit_id" // Unit-level unique constraint
                });

            if (error) {
                throw new Error("Failed to update unit progress");
            }
        } else {
            // -------------------------------------------------------
            // Chapter-level progress (old flow — upsert by user_id + chapter_id)
            // -------------------------------------------------------
            const chapterUpsertData: Record<string, unknown> = {
                user_id: user.id,
                chapter_id: chapterId,
                updated_at: new Date().toISOString(),
            };

            if (isCompleted !== undefined) {
                chapterUpsertData.is_completed = isCompleted;
            }

            if (lastPlayedSecond !== undefined) {
                chapterUpsertData.last_played_second = lastPlayedSecond;
            }

            const { error } = await supabase
                .from("user_progress")
                .upsert(chapterUpsertData, {
                    onConflict: "user_id, chapter_id"
                });

            if (error) {
                throw new Error("Failed to update chapter progress");
            }
        }

        if (isCompleted) {
            try {
                await awardPointsAction(5, "Completed Course Chapter", { chapter_id: chapterId }, false);
            } catch (pError) {
                console.error("Failed to award points:", pError);
            }
        }

        after(() => {
            revalidatePath(`/courses/${courseId}`, "layout");
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Something went wrong" };
    }
}
