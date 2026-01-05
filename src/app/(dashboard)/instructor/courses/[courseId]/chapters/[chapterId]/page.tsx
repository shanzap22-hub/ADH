import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, LayoutDashboard, Video, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

import { ChapterTitleForm } from "@/components/courses/ChapterTitleForm";
import { ChapterDescriptionForm } from "@/components/courses/ChapterDescriptionForm";
import { ChapterAccessForm } from "@/components/courses/ChapterAccessForm";
import { ChapterVideoForm } from "@/components/courses/ChapterVideoForm";
import { ChapterAttachmentsForm } from "@/components/courses/ChapterAttachmentsForm";

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
    const { data: attachments } = await supabase
        .from("chapter_attachments")
        .select("id, name, file_url")
        .eq("chapter_id", chapterId)
        .order("created_at", { ascending: true });

    const requiredFields = [
        chapter.title,
        chapter.description,
        chapter.video_url,
    ];

    // Placeholder for completion
    // const totalFields = requiredFields.length;
    // const completedFields = requiredFields.filter(Boolean).length;
    // const completionText = \`(\${completedFields}/\${totalFields})\`;
    // const completionText = `(${completedFields}/${totalFields})`;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div className="w-full">
                    <Link
                        href={`/instructor/courses/${courseId}`}
                        className="flex items-center text-sm hover:opacity-75 transition mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to course setup
                    </Link>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col gap-y-2">
                            <h1 className="text-2xl font-medium">
                                Chapter Creation/Edit
                            </h1>
                            <span className="text-sm text-muted-foreground">
                                Complete all fields.
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center gap-x-2">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <LayoutDashboard className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Customize your chapter
                            </h2>
                        </div>
                        <ChapterTitleForm
                            initialData={chapter}
                            courseId={courseId}
                            chapterId={chapterId}
                        />
                        <ChapterDescriptionForm
                            initialData={chapter}
                            courseId={courseId}
                            chapterId={chapterId}
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-x-2">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <Eye className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Access Settings
                            </h2>
                        </div>
                        <ChapterAccessForm
                            initialData={chapter}
                            courseId={courseId}
                            chapterId={chapterId}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-x-2">
                        <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                            <Video className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                        </div>
                        <h2 className="text-xl font-medium">
                            Add a video
                        </h2>
                    </div>
                    <ChapterVideoForm
                        initialData={chapter}
                        courseId={courseId}
                        chapterId={chapterId}
                    />

                    {/* Attachments Section */}
                    <div className="mt-6">
                        <div className="flex items-center gap-x-2 mb-4">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <FileText className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Resources & Attachments
                            </h2>
                        </div>
                        <ChapterAttachmentsForm
                            initialData={chapter}
                            courseId={courseId}
                            chapterId={chapterId}
                            attachments={attachments || []}
                        />
                    </div>
                </div>
            </div>
        </div >
    );
}
