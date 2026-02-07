"use client";

import { useState, useMemo } from "react";
import { CourseCard } from "@/components/course-card";
import { cn } from "@/lib/utils";

type CourseWithProgressWithCategory = {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    price: number | null;
    category: string | { name: string } | null;
    chapters: { id: string }[];
    progress: number | null;
};

interface CoursesListProps {
    items: CourseWithProgressWithCategory[];
}

const FILTERS = [
    { label: "All Cases", value: "all" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Expired", value: "expired" },
];

export const CoursesList = ({
    items
}: CoursesListProps) => {
    const [activeFilter, setActiveFilter] = useState("all");

    // Defensive check
    if (!items || !Array.isArray(items)) {
        console.error("[COURSES_LIST] Invalid items prop:", items);
        return (
            <div className="text-center text-sm text-red-600 mt-10 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                Error loading courses. Please refresh the page.
            </div>
        );
    }

    // Memoize filtered items to avoid recalculating on every render
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const progress = item.progress || 0;

            if (activeFilter === "in_progress") {
                // Started but not finished (assuming > 0 and < 95 based on prompt)
                // Or usually in_progress means > 0.
                return progress > 0 && progress < 95;
            }

            if (activeFilter === "completed") {
                return progress >= 95;
            }

            if (activeFilter === "expired") {
                // Logic for expired courses.
                return false;
            }

            return true;
        });
    }, [items, activeFilter]);

    return (
        <div className="space-y-6">
            {/* Horizontal Filter Bar - Compact & Moved Up */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 -mt-2">
                {FILTERS.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        className={cn(
                            "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border",
                            activeFilter === filter.value
                                ? "bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 text-white shadow-lg shadow-pink-500/20"
                                : "bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                        )}
                    >
                        {filter.label === "All Cases" ? "All" : filter.label}
                    </button>
                ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item, index) => {
                    // Defensive check for each item
                    if (!item || !item.id) {
                        return null;
                    }

                    const categoryName = typeof item.category === 'object' && item.category !== null && 'name' in item.category
                        ? item.category.name
                        : typeof item.category === 'string'
                            ? item.category
                            : "General";

                    // Cycle through premium brand light colors & matching titles
                    const themeVariants = [
                        { card: "bg-indigo-50/80 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900", title: "text-indigo-900 dark:text-indigo-100" },
                        { card: "bg-pink-50/80 border-pink-100 dark:bg-pink-950/30 dark:border-pink-900", title: "text-pink-900 dark:text-pink-100" },
                        { card: "bg-orange-50/80 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900", title: "text-orange-900 dark:text-orange-100" },
                        { card: "bg-purple-50/80 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900", title: "text-purple-900 dark:text-purple-100" }
                    ];

                    const variant = themeVariants[index % themeVariants.length];

                    return (
                        <CourseCard
                            key={item.id}
                            id={item.id}
                            title={item.title || "Untitled Course"}
                            imageUrl={item.image_url || "/placeholder-course.jpg"}
                            chaptersLength={item.chapters?.length || 0}
                            price={item.price || 0}
                            progress={item.progress}
                            category={categoryName}
                            backgroundClass={variant.card}
                            titleClass={variant.title}
                        />
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <span className="text-2xl">👀</span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        No courses found
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        There are no courses in the "{FILTERS.find(f => f.value === activeFilter)?.label}" category.
                    </p>
                    {activeFilter !== "all" && (
                        <button
                            onClick={() => setActiveFilter("all")}
                            className="mt-4 text-sm font-medium text-purple-600 hover:underline"
                        >
                            View all courses
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
