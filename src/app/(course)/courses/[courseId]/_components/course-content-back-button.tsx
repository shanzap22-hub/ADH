"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface CourseContentBackButtonProps {
    href: string;
    label: string;
    className?: string;
}

export const CourseContentBackButton = ({
    href,
    label,
    className
}: CourseContentBackButtonProps) => {
    return (
        <Link
            href={href}
            className={cn(
                "inline-flex items-center text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                className
            )}
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {label}
        </Link>
    );
};
