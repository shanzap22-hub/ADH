"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface CourseContentBackButtonProps {
    href?: string;
    label?: string;
    className?: string;
}

export const CourseContentBackButton = ({
    className
}: CourseContentBackButtonProps) => {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={cn(
                "inline-flex items-center text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent border-none p-0 cursor-pointer focus:outline-none",
                className
            )}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
        </button>
    );
};
