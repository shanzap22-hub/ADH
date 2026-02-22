"use client";

import { cn } from "@/lib/utils";

interface ModernLoaderProps {
    className?: string;
}

export const ModernLoader = ({ className }: ModernLoaderProps) => {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[150px]", className)}>
            <div className="relative w-20 h-20 mb-6">
                {/* Glowing orbs */}
                <div className="absolute top-0 -left-2 w-12 h-12 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 -right-2 w-12 h-12 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-4 left-4 w-12 h-12 bg-violet-600 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

                {/* Central spinning element */}
                <div className="absolute inset-2 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-slate-200/30 rounded-full relative">
                        <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-tr from-fuchsia-500 to-violet-600 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)] -mt-1 -mr-1 animate-spin origin-[-10px_14px]"></div>
                    </div>
                </div>
            </div>

            {/* Minimalist text */}
            <div className="flex items-center gap-1 font-mono text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                <span>Loading</span>
                <span className="animate-pulse">.</span>
                <span className="animate-pulse animation-delay-200">.</span>
                <span className="animate-pulse animation-delay-400">.</span>
            </div>
        </div>
    );
};
