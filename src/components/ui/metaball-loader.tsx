"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

interface MetaballLoaderProps {
    className?: string;
    /**
     * If true, overlays the entire screen with fixed positioning.
     * Defaults to false (inline).
     */
    fullscreen?: boolean;
}

export const MetaballLoader = ({ className, fullscreen = false }: MetaballLoaderProps) => {
    // Generate a unique ID for the filter to prevent conflicts if multiple loaders exist
    // However, SVG filters in React with useId can be tricky with url() references.
    // We'll use a deterministic ID strategy or scope it.
    // For safety with hydration, we stick to a simple ID but rely on the fact that
    // identical filters don't visually break if duplicated.
    const filterId = "goo-metaball-" + useId().replace(/:/g, "");
    const filterUrl = `url(#${filterId})`;

    return (
        <div className={cn(
            // Baseline styling
            "flex flex-col items-center justify-center",
            // Fullscreen styling
            fullscreen && "fixed inset-0 z-[9999] pointer-events-none",
            className
        )}>
            <svg className="hidden">
                <defs>
                    <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                        <feBlend in="SourceGraphic" in2="goo" />
                    </filter>
                </defs>
            </svg>

            <div
                className="relative w-14 h-14 opacity-90"
                style={{ filter: filterUrl }}
            >
                {/* Sphere 1: Deep Purple/Indigo (Logo Dark) */}
                <div
                    className="absolute top-0 left-1/2 w-6 h-6 -ml-3 rounded-full bg-gradient-to-tr from-violet-800 to-indigo-900 animate-[spin_2s_linear_infinite]"
                    style={{ transformOrigin: "50% 120%" }}
                />

                {/* Sphere 2: Vibrant Pink/Magenta (Logo Mid) */}
                <div
                    className="absolute bottom-1 left-1 w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-500 to-pink-600 mix-blend-screen animate-[spin_2s_linear_infinite]"
                    style={{ transformOrigin: "120% -20%", animationDelay: "-0.5s" }}
                />

                {/* Sphere 3: Bright Yellow/Orange (Logo Highlight) */}
                <div
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 mix-blend-screen animate-[spin_2s_linear_infinite]"
                    style={{ transformOrigin: "-20% -20%", animationDelay: "-1s" }}
                />
            </div>
        </div>
    );
};
