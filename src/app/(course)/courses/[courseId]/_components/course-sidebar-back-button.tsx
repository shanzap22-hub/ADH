"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export const CourseSidebarBackButton = () => {
    return (
        <Link
            href="/dashboard"
            className="flex items-center text-sm font-medium mb-4 transition-colors text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
        </Link>
    );
};
