"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MetaballLoader } from "@/components/ui/metaball-loader";
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
    const [isLoading, setIsLoading] = useState(false);

    return (
        <>
            {isLoading && <MetaballLoader fullscreen />}
            <Link
                href={href}
                onClick={() => setIsLoading(true)}
                className={cn(
                    "inline-flex items-center text-sm font-medium transition-colors",
                    isLoading
                        ? "text-orange-500"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
                    className
                )}
            >
                <ArrowLeft className={cn("h-4 w-4 mr-2", isLoading && "text-orange-500")} />
                {label}
            </Link>
        </>
    );
};
