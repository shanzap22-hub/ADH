"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LessonViewer } from "@/components/course/LessonViewer";
import { LessonNavigation } from "@/components/course/LessonNavigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Chapter {
    id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    position: number;
    isCompleted?: boolean;
    isLocked?: boolean;
    lastPlayedSecond?: number;
    attachments?: { id: string; name: string; url: string }[];
}

interface LearnPageClientProps {
    courseId: string;
    chapters: Chapter[];
}

export default function LearnPageClient({
    courseId,
    chapters
}: LearnPageClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentLessonId = searchParams.get("lesson");

    // Find current lesson
    const currentIndex = chapters.findIndex(ch => ch.id === currentLessonId);
    const currentChapter = currentIndex >= 0 ? chapters[currentIndex] : chapters[0];
    const lessonNumber = currentIndex >= 0 ? currentIndex + 1 : 1;

    // Navigation handlers
    const handlePrevious = () => {
        if (currentIndex > 0) {
            const prevChapter = chapters[currentIndex - 1];
            router.push(`/courses/${courseId}/learn?lesson=${prevChapter.id}`);
        }
    };

    const handleNext = () => {
        if (currentIndex < chapters.length - 1) {
            const nextChapter = chapters[currentIndex + 1];
            router.push(`/courses/${courseId}/learn?lesson=${nextChapter.id}`);
        }
    };

    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < chapters.length - 1;

    if (!currentChapter) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-500">No lessons available</p>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] flex overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Sidebar is handled by layout.tsx */}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Back Button Header */}
                <div className="flex-none p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center md:hidden">
                    <Link href={`/courses/${courseId}`}>
                        <Button variant="ghost" size="sm" className="pl-0 gap-2 hover:bg-transparent">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Course
                        </Button>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <LessonViewer
                        courseId={courseId}
                        chapterId={currentChapter.id}
                        title={currentChapter.title}
                        description={currentChapter.description}
                        videoUrl={currentChapter.video_url}
                        lessonNumber={lessonNumber}
                        isCompleted={!!currentChapter.isCompleted}
                        lastPlayedSecond={currentChapter.lastPlayedSecond}
                        attachments={currentChapter.attachments || []}
                        onComplete={() => {
                            router.refresh();
                        }}
                    />
                </div>

                {/* Navigation */}
                <LessonNavigation
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                />
            </div>
        </div>
    );
}
