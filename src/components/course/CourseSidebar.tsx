"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Lock, ChevronRight, Menu, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Chapter {
    id: string;
    title: string;
    position: number;
    isCompleted?: boolean;
    isLocked?: boolean;
}

interface CourseSidebarProps {
    courseId: string;
    chapters: Chapter[];
    currentChapterId?: string;
}

export const CourseSidebar = ({
    courseId,
    chapters,
    currentChapterId
}: CourseSidebarProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleChapterClick = (chapterId: string, isLocked: boolean) => {
        if (isLocked) return;

        router.push(`/courses/${courseId}/learn?lesson=${chapterId}`);
        setIsOpen(false); // Close mobile menu
    };

    const sidebarContent = (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                        Course Content
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {chapters.length} lessons
                </p>
            </div>

            {/* Lessons List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {chapters.map((chapter, index) => {
                    const isActive = chapter.id === currentChapterId;
                    const isLocked = chapter.isLocked || false;

                    return (
                        <button
                            key={chapter.id}
                            onClick={() => handleChapterClick(chapter.id, isLocked)}
                            disabled={isLocked}
                            className={`
                                w-full text-left p-3 rounded-lg transition-all
                                ${isActive
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-500'
                                    : 'border-2 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                                }
                                ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Status Icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    {chapter.isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : isLocked ? (
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    ) : isActive ? (
                                        <div className="h-5 w-5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-orange-500" />
                                        </div>
                                    ) : (
                                        <Circle className="h-5 w-5 text-slate-400" />
                                    )}
                                </div>

                                {/* Lesson Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Lesson {index + 1}
                                    </div>
                                    <div className={`font-medium ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                                        {chapter.title}
                                    </div>
                                </div>

                                {/* Arrow for active */}
                                {isActive && (
                                    <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <Button
                variant="outline"
                size="sm"
                className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-slate-900"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-80 h-full">
                {sidebarContent}
            </div>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <>
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="md:hidden fixed inset-y-0 left-0 w-80 z-50">
                        {sidebarContent}
                    </div>
                </>
            )}
        </>
    );
};
