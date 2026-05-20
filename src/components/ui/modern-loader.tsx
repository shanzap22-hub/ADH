"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ModernLoaderProps {
    className?: string;
}

export const ModernLoader = ({ className }: ModernLoaderProps) => {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[120px]", className)}>
            <div className="relative flex items-center justify-center mb-4">
                {/* Clean, professional circular spinner */}
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>

            {/* Minimalist text */}
            <div className="flex items-center gap-1 font-sans text-xs font-semibold tracking-[0.15em] text-slate-400 dark:text-slate-500 uppercase">
                <span>Loading</span>
                <span className="animate-pulse">.</span>
                <span className="animate-pulse animation-delay-200">.</span>
                <span className="animate-pulse animation-delay-400">.</span>
            </div>
        </div>
    );
};
