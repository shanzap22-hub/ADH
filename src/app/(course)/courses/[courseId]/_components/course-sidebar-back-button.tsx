"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const CourseSidebarBackButton = () => {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className="flex items-center text-sm font-medium mb-4 transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent border-none p-0 cursor-pointer focus:outline-none"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
        </button>
    );
};
