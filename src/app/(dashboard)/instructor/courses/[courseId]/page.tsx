import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TitleForm } from "@/components/courses/TitleForm";
import { DescriptionForm } from "@/components/courses/DescriptionForm";
import { ImageForm } from "@/components/courses/ImageForm";
import { ChaptersForm } from "@/components/courses/ChaptersForm";
import { LayoutDashboard, ListChecks } from "lucide-react";
import { CoursePublishButton } from "@/components/course-publish-button";
import { Badge } from "@/components/ui/badge";

export default async function CourseIdPage({
    params
}: {
    params: Promise<{ courseId: string }>
}) {
    const { courseId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/");
    }

    const { data: course } = await supabase
        .from("courses")
        .select("*, chapters(*)")
        .eq("id", courseId)
        .order("position", { foreignTable: "chapters", ascending: true })
        .single();

    if (!course) {
        return redirect("/");
    }

    const requiredFields = [
        course.title,
        course.description,
        course.image_url,
        course.price,
        course.category_id // Future
    ];

    // Placeholder for completion logic
    // const totalFields = requiredFields.length;
    // const completedFields = requiredFields.filter(Boolean).length;
    // const completionText = \`(\${completedFields}/\${totalFields})\`;
    // const completionText = `(${completedFields}/${totalFields})`;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-y-2">
                    <h1 className="text-2xl font-medium">
                        Course Setup
                    </h1>
                    <span className="text-sm text-slate-700">
                        Complete all fields and publish when ready
                    </span>
                </div>
                <div className="flex items-center gap-x-2">
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Published" : "Draft"}
                    </Badge>
                    <CoursePublishButton
                        courseId={courseId}
                        isPublished={course.is_published || false}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
                <div>
                    <div className="flex items-center gap-x-2">
                        <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                            <LayoutDashboard className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                        </div>
                        <h2 className="text-xl font-medium">
                            Customize your course
                        </h2>
                    </div>
                    <TitleForm
                        initialData={course}
                        courseId={course.id}
                    />
                    <DescriptionForm
                        initialData={course}
                        courseId={course.id}
                    />
                    <ImageForm
                        initialData={course}
                        courseId={course.id}
                    />
                </div>
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-x-2">
                            <div className="rounded-full flex items-center justify-center bg-sky-100 p-2 dark:bg-sky-900">
                                <ListChecks className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                            </div>
                            <h2 className="text-xl font-medium">
                                Course chapters
                            </h2>
                        </div>
                        {/* ChaptersForm */}
                        <ChaptersForm
                            initialData={course}
                            courseId={course.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
