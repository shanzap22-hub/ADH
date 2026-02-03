"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MetaballLoader } from "@/components/ui/metaball-loader";
import { cn } from "@/lib/utils";

export const CourseSidebarBackButton = () => {
    const [isLoading, setIsLoading] = useState(false);

    return (
        <>
            {isLoading && <MetaballLoader fullscreen />}
            <Link
                href="/dashboard"
                onClick={() => setIsLoading(true)}
                className={cn(
                    "flex items-center text-sm font-medium mb-4 transition-colors",
                    isLoading
                        ? "text-orange-500"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                )}
            >
                <ArrowLeft className={cn("h-4 w-4 mr-2", isLoading && "text-orange-500")} />
                Back to Dashboard
            </Link>
        </>
    );
};
