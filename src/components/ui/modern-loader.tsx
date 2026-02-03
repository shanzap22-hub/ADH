"use client";

import { cn } from "@/lib/utils";

interface ModernLoaderProps {
    className?: string;
}

export const ModernLoader = ({ className }: ModernLoaderProps) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="h-4 w-4 rounded-full bg-violet-800 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="h-4 w-4 rounded-full bg-fuchsia-500 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="h-4 w-4 rounded-full bg-yellow-400 animate-bounce"></div>
        </div>
    );
};
